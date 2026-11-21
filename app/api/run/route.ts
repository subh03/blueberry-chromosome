// GET  /api/run  (Vercel cron, daily 06:00 IST) -> RunLog
// POST /api/run  (manual trigger)               -> RunLog
// Both need `Authorization: Bearer <CRON_SECRET>`; Vercel cron sends it automatically.
// STUB: returns data/sample/run-log.json with fresh timestamps. Real version: startRun -> regenerate
// cards from stored evidence -> finishRun (lib/db/queries) with the server client.
import { timingSafeEqual } from "node:crypto";
import type { RunLog } from "@/types";
import sample from "@/data/sample/run-log.json";
import { jsonError } from "../_lib/json";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed when not configured
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function run(trigger: RunLog["trigger"]): Response {
  const now = new Date().toISOString();
  const log: RunLog = { ...(sample.runs[0] as RunLog), id: `run-${now}`, trigger, started_at: now, finished_at: now };
  return Response.json(log);
}

export async function GET(request: Request) {
  if (!authorized(request)) return jsonError(401, "Unauthorized");
  return run("cron");
}

export async function POST(request: Request) {
  if (!authorized(request)) return jsonError(401, "Unauthorized");
  return run("manual");
}
