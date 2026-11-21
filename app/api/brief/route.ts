// GET /api/brief?am=AM-01 -> AmBrief (types/index.ts)
// STUB: returns data/sample/am-brief.json. Real version: getAmBrief(getServerDb() or anon client, am) from lib/db/queries.
import type { AmBrief } from "@/types";
import sample from "@/data/sample/am-brief.json";
import { jsonError, stripNote } from "../_lib/json";

const AM_ID = /^AM-\d{1,3}$/;

export async function GET(request: Request) {
  const am = new URL(request.url).searchParams.get("am") ?? sample.area_manager_id;
  if (!AM_ID.test(am)) return jsonError(400, "am must look like AM-01");
  if (am !== sample.area_manager_id) return jsonError(404, `No brief for ${am}`);
  const brief = stripNote(sample) as AmBrief;
  return Response.json(brief);
}
