// Data helpers shared by the API routes. Each takes a client, so reads can run with the
// anon client and writes with the server client. Errors are thrown, never swallowed.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionCard, AmBrief, DataQualityFlag, Issue, RunLog, StoreMetrics } from "@/types";
import type { Database } from "./database.types";
import { toAmBrief, toIssue } from "./brief";

type Db = SupabaseClient<Database>;
type Tables = Database["public"]["Tables"];

/** For list/single queries: throws on error, and on a missing result. */
function check<T>(res: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  if (res.data == null) throw new Error(`${what}: no data`);
  return res.data;
}

/** For writes that return no rows: throws on error only. */
function ok(res: { error: { message: string } | null }, what: string): void {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
}

/** For maybeSingle queries: throws on error, null when the row is absent. */
function maybe<T>(res: { data: T | null; error: { message: string } | null }, what: string): T | null {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

/** Latest as_of that has issues, or null when the DB is still empty. */
export async function getLatestAsOf(db: Db): Promise<string | null> {
  const rows = check(await db.from("issues").select("as_of").order("as_of", { ascending: false }).limit(1), "latest as_of");
  return rows[0]?.as_of ?? null;
}

export async function getAmBrief(db: Db, amId: string, asOf?: string): Promise<AmBrief | null> {
  const am = maybe(await db.from("area_managers").select("*").eq("area_manager_id", amId).maybeSingle(), "area manager");
  if (!am) return null;
  const day = asOf ?? (await getLatestAsOf(db));
  if (!day) return toAmBrief(am, "", []);
  const rows = check(await db.from("issues").select("*").eq("area_manager_id", amId).eq("as_of", day), "issues");
  return toAmBrief(am, day, rows);
}

export async function getIssue(db: Db, id: string): Promise<Issue | null> {
  const row = maybe(await db.from("issues").select("*").eq("id", id).maybeSingle(), "issue");
  return row ? toIssue(row) : null;
}

export async function getStoreMetrics(db: Db, storeId: string, asOf: string): Promise<StoreMetrics[]> {
  return check(await db.from("store_metrics").select("*").eq("store_id", storeId).eq("as_of", asOf), "store metrics") as StoreMetrics[];
}

export async function getDqFlags(db: Db): Promise<DataQualityFlag[]> {
  return check(await db.from("dq_flags").select("*"), "dq flags") as unknown as DataQualityFlag[];
}

export async function getLatestRun(db: Db): Promise<RunLog | null> {
  const rows = check(await db.from("runs").select("*").order("started_at", { ascending: false }).limit(1), "latest run");
  return (rows[0] as RunLog | undefined) ?? null;
}

/** Server client only (RLS blocks anon writes). */
export async function startRun(db: Db, trigger: RunLog["trigger"], asOf: string): Promise<string> {
  const row = check(await db.from("runs").insert({ trigger, as_of: asOf }).select("id").single(), "start run");
  return row.id;
}

/** Server client only. */
export async function finishRun(db: Db, id: string, result: Partial<Tables["runs"]["Update"]>): Promise<void> {
  ok(await db.from("runs").update({ ...result, finished_at: new Date().toISOString() }).eq("id", id), "finish run");
}

/** Server client only. */
export async function saveCard(db: Db, card: Omit<ActionCard, "id" | "created_at">): Promise<ActionCard> {
  const insert: Tables["cards"]["Insert"] = { ...card, validation: card.validation as unknown as Tables["cards"]["Insert"]["validation"] };
  return check(await db.from("cards").insert(insert).select("*").single(), "save card") as unknown as ActionCard;
}
