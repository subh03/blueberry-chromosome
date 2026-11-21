// GET /api/issues -> { issues: Issue[] (latest day, biggest rupees first), source: "db" | "sample" }
// Reads issues (evidence is inside each issue). Falls back to data/sample/issues.json only when
// the table is empty (detectors not run yet) or the read fails.
import { connection } from "next/server";
import type { Issue } from "@/types";
import sample from "@/data/sample/issues.json";
import { getBrowserDb } from "@/lib/db/browser";
import { listIssues } from "@/lib/db/queries";
import { dbOrSample } from "@/lib/db/mappers";
import { toIssue } from "@/lib/db/brief";
import { stripNote } from "../_lib/json";

export async function GET() {
  await connection();
  const body = await dbOrSample(
    async () => ({ issues: (await listIssues(getBrowserDb())).map(toIssue) }),
    (d) => d.issues.length === 0,
    stripNote(sample) as unknown as { issues: Issue[] },
  );
  return Response.json(body);
}
