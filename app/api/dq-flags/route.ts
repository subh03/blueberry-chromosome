// GET /api/dq-flags -> { flags: DataQualityFlag[] } (types/index.ts)
// STUB: returns data/sample/dq-flags.json. Real version reads Supabase via lib/db/queries.
import type { DataQualityFlag } from "@/types";
import sample from "@/data/sample/dq-flags.json";
import { stripNote } from "../_lib/json";

export async function GET() {
  return Response.json(stripNote(sample) as unknown as { flags: DataQualityFlag[] });
}
