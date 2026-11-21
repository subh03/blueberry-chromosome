// Run: npx tsx --test lib/db/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { dbOrSample, toDqFlag, toRunLog, type DqFlagRow, type RunRow } from "./mappers";

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
