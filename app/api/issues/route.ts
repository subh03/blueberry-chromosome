// GET /api/issues -> { issues: Issue[] } (types/index.ts)
// STUB: returns data/sample/issues.json. Real version reads Supabase via lib/db/queries.
import type { Issue } from "@/types";
import sample from "@/data/sample/issues.json";
import { stripNote } from "../_lib/json";

export async function GET() {
  return Response.json(stripNote(sample) as unknown as { issues: Issue[] });
}
