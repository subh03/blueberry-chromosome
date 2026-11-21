// Relevance-audit honesty fixes (21 Nov): recent-rate peer check, too-early repeat follow-ups, regional-taste row.
import { test } from "node:test";
import assert from "node:assert/strict";
import { choosePeer } from "../engine/detectors";
import { followupFor } from "../engine/followup";
import { buildBriefScorecard } from "../engine/scorecard";
import type { Issue } from "../types";

test("peer: a strong 12-month peer whose last 8 weeks fell below the store norm is skipped", () => {
  const p = choosePeer([
    { salesperson_id: "A", display_name: "A", year: 0.333, recent: 0.063 }, // the KNP-01 SP1044 shape
    { salesperson_id: "B", display_name: "B", year: 0.254, recent: 0.368 },
    { salesperson_id: "C", display_name: "C", year: 0.216, recent: 0.172 },
  ], 0.198);
  assert.equal(p?.salesperson_id, "B");
});

test("peer: no recent bills to judge keeps the 12-month best; everyone failing gives no peer", () => {
  assert.equal(choosePeer([{ salesperson_id: "A", display_name: "A", year: 1, recent: null }], 0.8)?.salesperson_id, "A");
  assert.equal(choosePeer([{ salesperson_id: "A", display_name: "A", year: 0.5, recent: 0.1 }], 0.3), null);
  assert.equal(choosePeer([{ salesperson_id: "A", display_name: "A", year: null, recent: 0.9 }], 0.3), null);
});

const step = (label: string, value: number, display: string) => ({ label, value, display, formula: "f", rows: 1 });
const mk = (asOf: string, type: string, v: number): Issue => ({
  id: `${asOf}:S1:${type}:SP1`, as_of: asOf, store_id: "S1", area_manager_id: "AM", lever: "more_repeat", type, rupees_at_stake: 1, rank: 1,
  cause: "c", action: { who: "w", what: "x", when: "today" }, followup: null,
  evidence: { store_id: "S1", as_of: asOf, lever: "more_repeat", type, steps: [step("A: customers who came back, all time", v, `${v}%`)], cause: "c", peer: null, allowedNumbers: [] },
} as unknown as Issue);

for (const type of ["low_repeat", "role_model"]) {
  test(`follow-up: ${type} after one week is too early to tell, neutral, numbers kept`, () => {
    const f = followupFor(mk("2026-10-24", type, 3.05), mk("2026-10-31", type, 3.14))!;
    assert.equal(f.direction, "too_early");
    assert.equal(f.improved, undefined);
    assert.equal(f.before, 3.05);
    assert.equal(f.after, 3.14);
    assert.equal(f.display, "Repeat rate 3.0% → 3.1%. Too early to tell: repeat rates move over months.");
    assert.doesNotMatch(f.display, /\bup\b|improv/i);
  });
}

test("scorecard: regional taste is a not-a-problem row with the within-city reason", () => {
  const sc = buildBriefScorecard("2026-10-31", [], []);
  const r = sc.rows.find((x) => x.type === "regional_taste")!;
  assert.equal(r.lever, "not_a_problem");
  assert.equal(r.brief_problem, "Regional taste differences");
  assert.equal(r.reason, "We compare each store and each salesperson only with peers in the same city and state, so a regional taste difference is not flagged.");
  assert.equal(r.kind, "data_quality");
});
