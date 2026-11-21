// GET /api/brief?am=AM-01 -> AmBrief & { source: "db" | "sample" }
// Reads area_managers + issues through toAmBrief (<= max alerts, sorted by rupees, city_slowdown -> market note).
// Sample fallback (AM-01 only, the one in data/sample/am-brief.json) when the issues table is empty or the read fails.
import { connection } from "next/server";
import type { AmBrief } from "@/types";
import sample from "@/data/sample/am-brief.json";
import { getBrowserDb } from "@/lib/db/browser";
import { getAmBrief, listIssues } from "@/lib/db/queries";
import { jsonError, stripNote } from "../_lib/json";

const AM_ID = /^AM-\d{1,3}$/;
const sampleBrief = stripNote(sample) as AmBrief;

export async function GET(request: Request) {
  await connection();
  const am = new URL(request.url).searchParams.get("am") ?? sampleBrief.area_manager_id;
  if (!AM_ID.test(am)) return jsonError(400, "am must look like AM-01");
  const hasSample = am === sampleBrief.area_manager_id;

  try {
    const db = getBrowserDb();
    if (hasSample && (await listIssues(db)).length === 0) return Response.json({ ...sampleBrief, source: "sample" });
    const brief = await getAmBrief(db, am);
    if (!brief) return jsonError(404, `No brief for ${am}`);
    return Response.json({ ...brief, source: "db" });
  } catch (err) {
    console.warn("[api/brief] read failed:", err instanceof Error ? err.message : err);
    if (hasSample) return Response.json({ ...sampleBrief, source: "sample" });
    return jsonError(503, "Store data is unavailable. Please try again.");
  }
}
