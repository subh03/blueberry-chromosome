// Pure mappers from DB rows to the types/index.ts contract, plus the DB-or-sample rule. No I/O.
import type { DataQualityFlag, RunLog, ScorecardRow } from "@/types";
import type { Database } from "./database.types";
import type { IssueRow } from "./brief";

type Tables = Database["public"]["Tables"];
export type DqFlagRow = Tables["dq_flags"]["Row"];
export type RunRow = Tables["runs"]["Row"];
export type DataSource = "db" | "sample";

/** The DB check constraints guarantee kind is a DqKind and alerted is false. */
export function toDqFlag(row: DqFlagRow): DataQualityFlag {
  return { ...row, kind: row.kind as DataQualityFlag["kind"], alerted: false };
}

/** The DB check constraint guarantees trigger is one of the RunLog triggers. */
export function toRunLog(row: RunRow): RunLog {
  return { ...row, trigger: row.trigger as RunLog["trigger"] };
}

/**
 * The route rule: read the database first; use the sample only when the result is empty
 * or the query fails. The response says which one it is in `source`.
 */
export async function dbOrSample<T extends object>(
  read: () => Promise<T>,
  isEmpty: (data: T) => boolean,
  sample: T,
): Promise<T & { source: DataSource }> {
  try {
    const data = await read();
    if (!isEmpty(data)) return { ...data, source: "db" };
  } catch (err) {
    console.warn("[db] read failed, serving sample:", err instanceof Error ? err.message : err);
  }
  return { ...sample, source: "sample" };
}

type Problem = Pick<ScorecardRow, "lever" | "brief_problem" | "type">;

/**
 * One row per problem the brief lists (the catalogue). Detector types are "found" when any issue
 * of that type exists: stores in rupee order, the biggest issue, and the summed rupees at stake.
 * DQ kinds become "data_issue" rows (never alerts) listing their stores.
 */
export function buildScorecard(catalogue: Problem[], issues: IssueRow[], flags: DataQualityFlag[]): ScorecardRow[] {
  return catalogue.map((p) => {
    if (p.lever === "not_a_problem") {
      const stores = flags.filter((f) => f.kind === p.type && f.store_id).map((f) => f.store_id as string);
      return { ...p, status: stores.length || flags.some((f) => f.kind === p.type) ? "data_issue" : "not_found",
        store_ids: [...new Set(stores)], top_issue_id: null, rupees_at_stake: null };
    }
    const matching = issues.filter((i) => i.type === p.type).sort((a, b) => b.rupees_at_stake - a.rupees_at_stake);
    if (matching.length === 0) return { ...p, status: "not_found", store_ids: [], top_issue_id: null, rupees_at_stake: null };
    return {
      ...p,
      status: "found",
      store_ids: [...new Set(matching.map((i) => i.store_id))],
      top_issue_id: matching[0].id,
      rupees_at_stake: matching.reduce((sum, i) => sum + i.rupees_at_stake, 0),
    };
  });
}
