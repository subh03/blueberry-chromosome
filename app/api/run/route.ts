// GET  /api/run  (Vercel cron, daily 06:00 IST) -> RunLog
// POST /api/run  (manual "Run now")             -> RunLog
// Needs `Authorization: Bearer <CRON_SECRET>` (Vercel cron sends it).
// Writes a runs row: reads the latest issues, regenerates one card per issue (for the seller or the manager, see cardAudience) from the
// stored evidence (Gemini or template), saves the cards, then records the counts, ok and error.
import { timingSafeEqual } from "node:crypto";
import type { RunLog } from "@/types";
import { getServerDb } from "@/lib/db/server";
import { finishRun, getLatestAsOf, listIssues, saveCard, startRun } from "@/lib/db/queries";
import { toIssue } from "@/lib/db/brief";
import { toRunLog } from "@/lib/db/mappers";
import { makeCard } from "../_lib/make-card";
import { cardAudience } from "../_lib/card";
import { jsonError } from "../_lib/json";

export const maxDuration = 300;
const BATCH = 5;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed when not configured
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function run(trigger: RunLog["trigger"]): Promise<Response> {
  const db = getServerDb();
  let runId: string;
  try {
    const asOf = (await getLatestAsOf(db)) ?? new Date().toISOString().slice(0, 10);
    runId = await startRun(db, trigger, asOf);
  } catch (err) {
    console.error("[api/run] could not start run:", err instanceof Error ? err.message : err);
    return jsonError(503, "Could not start the run.");
  }

  const tally = { rows_read: 0, issues: 0, cards: 0, gemini_ok: 0, gemini_fallback: 0 };
  let error: string | null = null;
  try {
    const issues = (await listIssues(db)).map(toIssue);
    tally.rows_read = issues.length;
    tally.issues = issues.length;
    for (let i = 0; i < issues.length; i += BATCH) {
      const cards = await Promise.all(issues.slice(i, i + BATCH).map((issue) => makeCard(issue, cardAudience(issue))));
      for (const card of cards) {
        await saveCard(db, card);
        tally.cards++;
        if (card.source === "gemini") tally.gemini_ok++;
        else tally.gemini_fallback++;
      }
    }
  } catch (err) {
    // runs is publicly readable (/api/run-log): store a generic message, keep details in server logs.
    error = "Run failed while generating cards; see server logs.";
    console.error("[api/run] run failed:", err instanceof Error ? err.message : err);
  }

  try {
    const row = await finishRun(db, runId, { ...tally, ok: error === null, error });
    return Response.json(toRunLog(row), { status: error ? 500 : 200 });
  } catch (err) {
    console.error("[api/run] could not finish run:", err instanceof Error ? err.message : err);
    return jsonError(503, "Run finished but could not be recorded.");
  }
}

export async function GET(request: Request) {
  if (!authorized(request)) return jsonError(401, "Unauthorized");
  return run("cron");
}

export async function POST(request: Request) {
  if (!authorized(request)) return jsonError(401, "Unauthorized");
  return run("manual");
}
