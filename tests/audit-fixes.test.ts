// Persona-audit fixes (21 Nov): H2 card vs action, M2 follow-up flat vs displayed values, M1 ₹ basis labels.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { actionCheck } from "../engine/card-semantics";
import { validateCard } from "../engine/card-validator";
import { buildCardPrompt } from "../engine/card-prompt";
import { renderTemplate } from "../engine/card-templates";
import { followupFor } from "../engine/followup";
import type { Issue } from "../types";

const { issues } = JSON.parse(readFileSync("data/generated/issues.json", "utf8")) as { issues: Issue[] };
const get = (id: string) => issues.find((x) => x.id === id) ?? assert.fail(`missing issue ${id}`);
const LKO1 = get("2026-10-31:LKO-01:low_repeat:SP1015");
const PAT1 = get("2026-10-31:PAT-01:low_repeat:SP1072");
const ROLE = get("2026-10-31:BLR-01:role_model:SP1110");

// ---------- H2: a salesperson card must say its issue's action ----------
test("H2: LKO-01 low_repeat card that says 'shadow Manoj T.' instead of the action is rejected", () => {
  const stored = "Tushar, shadow Manoj T. today to observe how they build customer relationships to improve repeat visits. Your current repeat rate is 3.1% while the store average is 8.2%.";
  assert.ok(actionCheck(stored, LKO1.action).some((r) => /does not say the action/.test(r)));
  assert.equal(validateCard(stored, LKO1.evidence).passed, false, "validateCard reads the action from evidence.action");
});

test("H2: a card that says the action word for word passes the action check", () => {
  const text = "From today, take the phone number on every bill and send a thank-you message the same evening. Your repeat rate is 3.4%.";
  assert.deepEqual(actionCheck(text, PAT1.action), []);
});

test("H2: the role model's own card may say the manager's action in the second person", () => {
  const text = "Karthik, at Saturday's morning huddle, show the team how you follow up with customers.";
  assert.deepEqual(actionCheck(text, ROLE.action), []);
});

test("H2: every issue's evidence carries its action, word for word", () => {
  for (const i of issues) assert.deepEqual(i.evidence.action, i.action, i.id);
});

test("H2: the salesperson prompt carries the action word for word and puts it first", () => {
  const p = buildCardPrompt(LKO1.evidence, { audience: "salesperson" });
  assert.match(p, /take the phone number on every bill and send a thank-you message the same evening/);
  assert.match(p, /First sentence: the action/);
  assert.doesNotMatch(p, /say what to learn from them/);
});

test("H2: every template card passes the action check for its issue", () => {
  for (const i of issues) {
    if (!i.evidence.subject) continue;
    assert.deepEqual(actionCheck(renderTemplate(i), i.action), [], i.id);
  }
});

// ---------- M2: flat only when the DISPLAYED values are the same ----------
const step = (label: string, value: number) => ({ label, value, display: "x", formula: "f", rows: 1 });
const mk = (asOf: string, v: number) => ({
  id: `${asOf}:S1:missing_pair:SP1`, as_of: asOf, type: "missing_pair", // repeat rates are "too early" after a week
  evidence: { steps: [step("A: Kurta Set bills with a jacket", v)] },
}) as unknown as Issue;

test("M2: 3.05 → 3.14 shows '3.0% → 3.1%', so it moved up (not 'did not move')", () => {
  const f = followupFor(mk("2026-10-24", 3.05), mk("2026-10-31", 3.14))!;
  assert.equal(f.direction, "up");
  assert.equal(f.improved, true);
  assert.equal(f.display, "Pair rate 3.0% → 3.1% (up) since last week's alert.");
});

test("M2: direction always agrees with the displayed numbers", () => {
  for (let b = 2.9; b < 3.3; b += 0.01) {
    for (const d of [-0.07, -0.05, -0.04, 0, 0.04, 0.05, 0.06]) {
      const f = followupFor(mk("2026-10-24", b), mk("2026-10-31", b + d))!;
      const shown = f.display.match(/(-?[\d.]+)% → (-?[\d.]+)%/)!;
      const want = shown[1] === shown[2] ? "flat" : Number(shown[2]) > Number(shown[1]) ? "up" : "down";
      assert.equal(f.direction, want, f.display);
    }
  }
});

// ---------- M1: the ₹ label states its true basis; no ₹ value changes ----------
const BASIS: Record<string, string> = {
  staff_absent_or_left: "walk-ins", understaffed_busy_days: "walk-ins", conversion_drop_footfall_steady: "walk-ins",
  city_slowdown: "walk-ins", low_repeat: "new customers", missing_pair: "bills", category_avoidance: "bills",
  discount_above_norm: "MRP sales",
};

test("M1: every ₹ step says 'per 28 days, based on the last 28 days of <basis>', never 'next 28 days'", () => {
  for (const i of issues) {
    const s = i.evidence.steps.find((x) => /₹ at stake/.test(x.label))!;
    assert.doesNotMatch(s.label, /next 28 days/, i.id);
    if (i.type === "role_model") continue;
    assert.equal(s.label, `₹ at stake per 28 days, based on the last 28 days of ${BASIS[i.type]}`, i.id);
  }
});

test("M1: no ₹ value changed (pinned from the 21 Nov run before the label change)", () => {
  const pinned: Record<string, number> = {"2026-10-31:LKO-02:staff_absent_or_left":322400,"2026-10-31:LKO-01:low_repeat:SP1015":22600,"2026-10-31:LKO-01:low_repeat:SP1013":19700,"2026-10-31:LKO-01:missing_pair:SP1009":8400,"2026-10-31:KNP-01:missing_pair:SP1054":7200,"2026-10-31:KNP-01:city_slowdown":618300,"2026-10-31:PAT-01:discount_above_norm:SP1064":14200,"2026-10-31:PAT-01:low_repeat:SP1072":13600,"2026-10-31:PAT-02:low_repeat:SP1088":11800,"2026-10-31:PAT-01:discount_above_norm:SP1065":11600,"2026-10-31:PAT-02:low_repeat:SP1090":11500,"2026-10-31:PAT-02:missing_pair:SP1087":1600,"2026-10-31:BLR-03:understaffed_busy_days":199600,"2026-10-31:BLR-02:category_avoidance:SP1125":53800,"2026-10-31:BLR-01:low_repeat:SP1120":13300,"2026-10-31:BLR-01:low_repeat:SP1114":12100,"2026-10-31:BLR-01:low_repeat:SP1116":10800,"2026-10-31:BLR-04:low_repeat:SP1162":10600,"2026-10-31:BLR-01:missing_pair:SP1120":10300,"2026-10-31:BLR-01:discount_above_norm:SP1122":5000,"2026-10-31:BLR-01:role_model:SP1110":0};
  assert.deepEqual(Object.fromEntries(issues.map((i) => [i.id, i.rupees_at_stake])), pinned);
  for (const i of issues) {
    const s = i.evidence.steps.find((x) => /₹ at stake/.test(x.label))!;
    assert.equal(s.value, pinned[i.id], i.id);
  }
});

test("missing_pair template names the whole add-on group the metric counts (safa, mojari or mala), not just the first item", () => {
  const i = get("2026-10-31:PAT-02:missing_pair:SP1087");
  assert.match(renderTemplate(i), /add a safa, mojari or mala to 47\.8% of sherwani bills/);
});
