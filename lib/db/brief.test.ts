// Run: npx tsx --test lib/db/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { toAmBrief, type AreaManagerRow, type IssueRow } from "./brief";

const am: AreaManagerRow = { area_manager_id: "AM-01", name: "AM One", city: "Lucknow", max_alerts_per_week: 2 };

function issue(store_id: string, type: string, rupees: number): IssueRow {
  return {
    id: `2026-10-31:${store_id}:${type}`,
    as_of: "2026-10-31",
    store_id,
    area_manager_id: "AM-01",
    lever: "more_bills",
    type,
    rupees_at_stake: rupees,
    rank: 99,
    cause: `cause ${store_id}`,
    action: { who: "SM", what: "do it", when: "today" },
    evidence: { store_id, steps: [], allowedNumbers: [] },
    followup: null,
  };
}

test("toAmBrief keeps the top issues by rupees, caps at max_alerts_per_week, and re-ranks from 1", () => {
  const brief = toAmBrief(am, "2026-10-31", [
    issue("LKO-01", "missing_pair", 10_000),
    issue("LKO-02", "staff_absent_or_left", 124_000),
    issue("LKO-03", "discount_above_norm", 50_000),
  ]);
  assert.deepEqual(
    brief.issues.map((i) => [i.store_id, i.rank]),
    [["LKO-02", 1], ["LKO-03", 2]],
  );
  assert.equal(brief.max_alerts_per_week, 2);
});

test("toAmBrief turns city_slowdown into the market note, never a store alert", () => {
  const brief = toAmBrief(am, "2026-10-31", [issue("LKO-01", "city_slowdown", 999_999), issue("LKO-02", "missing_pair", 1)]);
  assert.equal(brief.market_note, "cause LKO-01");
  assert.deepEqual(brief.issues.map((i) => i.type), ["missing_pair"]);
});

test("toAmBrief breaks rupee ties by the engine's stored rank, then id, so the cap is stable", () => {
  const a = { ...issue("LKO-01", "role_model", 0), rank: 4 };
  const b = { ...issue("LKO-02", "role_model", 0), rank: 3 };
  const c = issue("LKO-03", "missing_pair", 5);
  const once = toAmBrief(am, "2026-10-31", [a, b, c]).issues.map((i) => i.store_id);
  const again = toAmBrief(am, "2026-10-31", [c, a, b]).issues.map((i) => i.store_id);
  assert.deepEqual(once, ["LKO-03", "LKO-02"]);
  assert.deepEqual(again, once);
});
