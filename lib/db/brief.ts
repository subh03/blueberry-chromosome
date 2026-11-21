// Pure mapping from DB rows to the AmBrief contract. No I/O, so it is safe anywhere and easy to test.
import type { AmBrief, Issue } from "@/types";
import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];
export type AreaManagerRow = Tables["area_managers"]["Row"];
export type IssueRow = Tables["issues"]["Row"];

/** jsonb columns come back as Json; the loader writes them in the contract shapes. */
export function toIssue(row: IssueRow): Issue {
  return row as unknown as Issue;
}

/**
 * Builds an area manager's weekly brief:
 * city_slowdown becomes the market note (a market issue, never a store alert),
 * every other issue is sorted by rupees at stake, capped at max_alerts_per_week and re-ranked from 1.
 */
export function toAmBrief(am: AreaManagerRow, asOf: string, rows: IssueRow[]): AmBrief {
  const slowdown = rows.find((r) => r.type === "city_slowdown");
  const issues = rows
    .filter((r) => r.type !== "city_slowdown")
    .sort((a, b) => b.rupees_at_stake - a.rupees_at_stake)
    .slice(0, am.max_alerts_per_week)
    .map((r, i) => ({ ...toIssue(r), rank: i + 1 }));

  return {
    area_manager_id: am.area_manager_id,
    name: am.name,
    city: am.city,
    as_of: asOf,
    max_alerts_per_week: am.max_alerts_per_week,
    issues,
    market_note: slowdown?.cause ?? null,
  };
}
