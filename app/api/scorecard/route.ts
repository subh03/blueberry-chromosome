// GET /api/scorecard -> { as_of: string; rows: ScorecardRow[] } (types/index.ts)
// STUB: returns data/sample/scorecard.json. Real version reads Supabase via lib/db/queries.
import type { ScorecardRow } from "@/types";
import sample from "@/data/sample/scorecard.json";
import { stripNote } from "../_lib/json";

export async function GET() {
  return Response.json(stripNote(sample) as unknown as { as_of: string; rows: ScorecardRow[] });
}
