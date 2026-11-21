// Run: npx tsx --test lib/db/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ScorecardRow } from "@/types";
import { buildScorecard, dbOrSample, toDqFlag, toRunLog, type DqFlagRow, type RunRow } from "./mappers";
import type { IssueRow } from "./brief";

test("toDqFlag maps a row and always sets alerted: false", () => {
  const row: DqFlagRow = { id: "dq:x", store_id: "PAT-03", kind: "bills_exceed_footfall", detail: "d", rows_affected: 11, alerted: false };
  assert.deepEqual(toDqFlag(row), { ...row, alerted: false });
});

test("toRunLog keeps every RunLog field and narrows trigger", () => {
  const row: RunRow = {
    id: "r1", trigger: "load", started_at: "2026-11-21T07:01:37Z", finished_at: null, as_of: "2026-10-31",
    rows_read: 388618, issues: 0, cards: 0, gemini_ok: 0, gemini_fallback: 0, ok: true, error: null,
  };
  assert.deepEqual(toRunLog(row), row);
});

test("dbOrSample returns db data tagged 'db' when the read has rows", async () => {
  assert.deepEqual(await dbOrSample(async () => ({ runs: [1] }), (d) => d.runs.length === 0, { runs: [] }), { runs: [1], source: "db" });
});

test("dbOrSample falls back to the sample when the table is empty", async () => {
  assert.deepEqual(await dbOrSample(async () => ({ runs: [] as number[] }), (d) => d.runs.length === 0, { runs: [9] }), { runs: [9], source: "sample" });
});

test("dbOrSample falls back to the sample when the query throws", async () => {
  const read = async (): Promise<{ runs: number[] }> => { throw new Error("db down"); };
  assert.deepEqual(await dbOrSample(read, (d) => d.runs.length === 0, { runs: [9] }), { runs: [9], source: "sample" });
});

const catalogue: Pick<ScorecardRow, "lever" | "brief_problem" | "type">[] = [
  { lever: "more_bills", brief_problem: "Staff left", type: "staff_absent_or_left" },
  { lever: "bigger_baskets", brief_problem: "Discounts", type: "discount_above_norm" },
  { lever: "more_repeat", brief_problem: "Role models", type: "role_model" },
  { lever: "not_a_problem", brief_problem: "Bad numbers", type: "bills_exceed_footfall" },
];

function issue(store_id: string, type: string, rupees: number): IssueRow {
  return {
    id: `2026-10-31:${store_id}:${type}`, as_of: "2026-10-31", store_id, area_manager_id: "AM-01", lever: "more_bills",
    type, rupees_at_stake: rupees, rank: 1, cause: "c", action: {}, evidence: {}, followup: null,
  };
}

test("buildScorecard marks found rows with their stores, the biggest issue and the summed rupees", () => {
  const rows = buildScorecard(catalogue, [issue("KNP-03", "discount_above_norm", 20_000), issue("PAT-01", "discount_above_norm", 13_000)], []);
  assert.deepEqual(rows[1], {
    lever: "bigger_baskets", brief_problem: "Discounts", type: "discount_above_norm", status: "found",
    store_ids: ["KNP-03", "PAT-01"], top_issue_id: "2026-10-31:KNP-03:discount_above_norm", rupees_at_stake: 33_000,
  });
});

test("buildScorecard marks problems with no issue as not_found", () => {
  const rows = buildScorecard(catalogue, [], []);
  assert.deepEqual(rows[2], { ...catalogue[2], status: "not_found", store_ids: [], top_issue_id: null, rupees_at_stake: null });
});

test("buildScorecard turns DQ kinds into data_issue rows with their stores and no rupees", () => {
  const flags = [toDqFlag({ id: "a", store_id: "PAT-03", kind: "bills_exceed_footfall", detail: "", rows_affected: 11, alerted: false })];
  const rows = buildScorecard(catalogue, [], flags);
  assert.deepEqual(rows[3], { ...catalogue[3], status: "data_issue", store_ids: ["PAT-03"], top_issue_id: null, rupees_at_stake: null });
});
