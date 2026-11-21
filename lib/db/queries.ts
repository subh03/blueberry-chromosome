// Data helpers shared by the API routes. Each takes a client, so reads can run with the
// anon client and writes with the server client. Errors are thrown, never swallowed.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionCard, AmBrief, Issue, RunLog, StoreMetrics } from "@/types";
import type { Database } from "./database.types";
import { toAmBrief, toIssue, type IssueRow } from "./brief";
import type { DqFlagRow, RunRow } from "./mappers";

type Db = SupabaseClient<Database>;
type Tables = Database["public"]["Tables"];

/** For list/single queries: throws on error, and on a missing result. */
function check<T>(res: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  if (res.data == null) throw new Error(`${what}: no data`);
  return res.data;
}

/** For maybeSingle queries: throws on error, null when the row is absent. */
function maybe<T>(res: { data: T | null; error: { message: string } | null }, what: string): T | null {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

/** Latest as_of with issues, else the latest metrics day, else null (empty DB). */
export async function getLatestAsOf(db: Db): Promise<string | null> {
  const issues = check(await db.from("issues").select("as_of").order("as_of", { ascending: false }).limit(1), "latest issue day");
  if (issues[0]) return issues[0].as_of;
  const metrics = check(await db.from("store_metrics").select("as_of").order("as_of", { ascending: false }).limit(1), "latest metrics day");
  return metrics[0]?.as_of ?? null;
}

/** Issues of the latest issue day, biggest rupees first. Empty when detectors have not run. */
export async function listIssues(db: Db): Promise<IssueRow[]> {
  const latest = check(await db.from("issues").select("as_of").order("as_of", { ascending: false }).limit(1), "latest issue day");
  if (!latest[0]) return [];
  return check(
    await db.from("issues").select("*").eq("as_of", latest[0].as_of).order("rupees_at_stake", { ascending: false }),
    "issues",
  );
}

export async function listDqFlags(db: Db): Promise<DqFlagRow[]> {
  return check(await db.from("dq_flags").select("*").order("id"), "dq flags");
}

/** Newest runs first. */
export async function listRuns(db: Db, limit = 20): Promise<RunRow[]> {
  return check(await db.from("runs").select("*").order("started_at", { ascending: false }).limit(limit), "runs");
}

export async function getAmBrief(db: Db, amId: string, asOf?: string): Promise<AmBrief | null> {
  const am = maybe(await db.from("area_managers").select("*").eq("area_manager_id", amId).maybeSingle(), "area manager");
  if (!am) return null;
  const day = asOf ?? (await getLatestAsOf(db));
  if (!day) return toAmBrief(am, "", []); // empty DB
  const rows = check(
    await db.from("issues").select("*").eq("area_manager_id", amId).eq("as_of", day).order("rank").order("id"),
    "issues",
  );
  return toAmBrief(am, day, rows);
}

export async function getIssue(db: Db, id: string): Promise<Issue | null> {
  const row = maybe(await db.from("issues").select("*").eq("id", id).maybeSingle(), "issue");
  return row ? toIssue(row) : null;
}

export async function getStoreMetrics(db: Db, storeId: string, asOf: string): Promise<StoreMetrics[]> {
  return check(await db.from("store_metrics").select("*").eq("store_id", storeId).eq("as_of", asOf), "store metrics") as StoreMetrics[];
}

/** All saved cards for an issue (written by /api/run or the card scripts); the route picks one. */
export async function listCardsForIssue(db: Db, issueId: string): Promise<ActionCard[]> {
  return check(await db.from("cards").select("*").eq("issue_id", issueId), "cards for issue") as unknown as ActionCard[];
}

/** One stored card by its id, or null. */
export async function getCardById(db: Db, id: string): Promise<ActionCard | null> {
  return maybe(await db.from("cards").select("*").eq("id", id).maybeSingle(), "card by id") as unknown as ActionCard | null;
}

/** Server client only (RLS blocks anon writes). */
export async function startRun(db: Db, trigger: RunLog["trigger"], asOf: string): Promise<string> {
  const row = check(await db.from("runs").insert({ trigger, as_of: asOf }).select("id").single(), "start run");
  return row.id;
}

/** Server client only. */
export async function finishRun(db: Db, id: string, result: Partial<Tables["runs"]["Update"]>): Promise<RunRow> {
  return check(
    await db.from("runs").update({ ...result, finished_at: new Date().toISOString() }).eq("id", id).select("*").single(),
    "finish run",
  );
}

/** Server client only. Inserts the card under its own id (e.g. `gemini:<issue_id>:am`); fails if the id exists. */
export async function insertCardWithId(db: Db, card: ActionCard): Promise<ActionCard> {
  const insert: Tables["cards"]["Insert"] = { ...card, validation: card.validation as unknown as Tables["cards"]["Insert"]["validation"] };
  return check(await db.from("cards").insert(insert).select("*").single(), "insert card") as unknown as ActionCard;
}

/** Server client only. */
export async function saveCard(db: Db, card: ActionCard): Promise<ActionCard> {
  const { id: _id, created_at: _at, ...rest } = card;
  void _id;
  void _at;
  const insert: Tables["cards"]["Insert"] = { ...rest, validation: rest.validation as unknown as Tables["cards"]["Insert"]["validation"] };
  return check(await db.from("cards").insert(insert).select("*").single(), "save card") as unknown as ActionCard;
}
