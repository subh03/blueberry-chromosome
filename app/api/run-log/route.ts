// GET /api/run-log -> { runs: RunLog[] (newest first), source: "db" | "sample" }
// Reads runs. Falls back to data/sample/run-log.json only when the table is empty or the read fails.
import { connection } from "next/server";
import type { RunLog } from "@/types";
import sample from "@/data/sample/run-log.json";
import { getBrowserDb } from "@/lib/db/browser";
import { listRuns } from "@/lib/db/queries";
import { dbOrSample, toRunLog } from "@/lib/db/mappers";
import { stripNote } from "../_lib/json";

export async function GET() {
  await connection();
  const body = await dbOrSample(
    async () => ({ runs: (await listRuns(getBrowserDb())).map(toRunLog) }),
    (d) => d.runs.length === 0,
    stripNote(sample) as { runs: RunLog[] },
  );
  return Response.json(body);
}
