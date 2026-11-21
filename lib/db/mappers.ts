// Pure mappers from DB rows to the types/index.ts contract, plus the DB-or-sample rule. No I/O.
import type { DataQualityFlag, RunLog } from "@/types";
import type { Database } from "./database.types";

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
