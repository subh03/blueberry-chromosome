// GET /api/run-log -> { runs: RunLog[] } (types/index.ts)
// STUB: returns data/sample/run-log.json. Real version reads Supabase via lib/db/queries.
import type { RunLog } from "@/types";
import sample from "@/data/sample/run-log.json";
import { stripNote } from "../_lib/json";

export async function GET() {
  return Response.json(stripNote(sample) as unknown as { runs: RunLog[] });
}
