// GET /api/scorecard -> { as_of, rows: ScorecardRow[], source: "db" | "sample" }
// Built from issues + dq_flags. The row list (the brief's own problems, in order) comes from the
// scorecard catalogue in data/sample/scorecard.json. Falls back to the sample only when the issues
// table is empty (detectors not run yet) or a read fails.
import { connection } from "next/server";
import type { ScorecardRow } from "@/types";
import sample from "@/data/sample/scorecard.json";
import { getBrowserDb } from "@/lib/db/browser";
import { listDqFlags, listIssues } from "@/lib/db/queries";
import { buildScorecard, dbOrSample, toDqFlag } from "@/lib/db/mappers";
import { stripNote } from "../_lib/json";

const sampleBody = stripNote(sample) as { as_of: string; rows: ScorecardRow[] };
const catalogue = sampleBody.rows.map(({ lever, brief_problem, type }) => ({ lever, brief_problem, type }));

export async function GET() {
  await connection();
  let issueCount = 0;
  const body = await dbOrSample(
    async () => {
      const db = getBrowserDb(); // inside the read, so a missing env falls back to the sample too
      const [issues, flags] = await Promise.all([listIssues(db), listDqFlags(db)]);
      issueCount = issues.length;
      return { as_of: issues[0]?.as_of ?? "", rows: buildScorecard(catalogue, issues, flags.map(toDqFlag)) };
    },
    () => issueCount === 0,
    sampleBody,
  );
  return Response.json(body);
}
