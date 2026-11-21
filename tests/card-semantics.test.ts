// Semantic checks: the number validator passes text whose numbers exist but whose MEANING is wrong.
// Every "bad" text below is a real stored card that passed the number validator on 21 Nov.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cardFacts, semanticCheck } from "../engine/card-semantics";
import { validateCard } from "../engine/card-validator";
import type { Issue } from "../types";

const { issues } = JSON.parse(readFileSync("data/generated/issues.json", "utf8")) as { issues: Issue[] };
const get = (id: string) => {
  const i = issues.find((x) => x.id === id);
  if (!i) throw new Error(`missing issue ${id}`);
  return i;
};
const KNP = get("2026-10-31:KNP-01:city_slowdown");
const LKO = get("2026-10-31:LKO-02:staff_absent_or_left");
const BLR3 = get("2026-10-31:BLR-03:understaffed_busy_days");
const ROLE = get("2026-10-31:BLR-01:role_model:SP1110");
const LOWREP = get("2026-10-31:PAT-02:low_repeat:SP1088");

const fails = (text: string, i: Issue, re: RegExp) => {
  const r = semanticCheck(text, i.evidence, i.action);
  assert.ok(r.some((x) => re.test(x)), `expected a reason matching ${re}, got ${JSON.stringify(r)}`);
};
const passes = (text: string, i: Issue) => assert.deepEqual(semanticCheck(text, i.evidence, i.action), []);

// ---------- facts ----------
test("facts: headcount comes from the action, store count from the evidence, role from the type", () => {
  assert.equal(cardFacts(BLR3.evidence, BLR3.action).people_on_floor, 7);
  assert.equal(cardFacts(KNP.evidence, KNP.action).stores_in_city, 3);
  assert.equal(cardFacts(ROLE.evidence, ROLE.action).subject_role, "role_model");
  assert.equal(cardFacts(LOWREP.evidence, LOWREP.action).subject_role, "underperformer");
  assert.equal(cardFacts(LKO.evidence, LKO.action).action, "Put Sumit A. on the floor at the busiest hours and have the newest seller shadow them");
  assert.deepEqual(cardFacts(LKO.evidence, LKO.action).dates, ["14 Sep", "15 Sep"]);
});

test("facts: the floor target still comes from the evidence when no action is given", () => {
  assert.equal(cardFacts(BLR3.evidence).people_on_floor, 7);
});

// ---------- headcount ----------
test("BLR-03: 'keep the floor count at 6.6' contradicts the action (keep 7 people)", () => {
  fails("Store team, BLR-03: this Saturday and Sunday keep the floor count at 6.6 to serve the 791 walk-ins.", BLR3, /headcount/);
});
test("headcount that matches the action passes", () => {
  passes("Store manager, BLR-03: this Saturday and Sunday keep 7 people on the floor. Weekend conversion fell from 13.0% to 9.8%.", BLR3);
});
test("describing the old and new averages is not an instruction", () => {
  passes("Store manager, BLR-03: weekend floor staff fell from 7.4 to 6.6. This Saturday and Sunday keep 7 people on the floor.", BLR3);
});

// ---------- counts of stores and people ----------
test("KNP-01: 'the other 3 Kanpur stores' makes 4 stores, the evidence counts 3", () => {
  fails("Store team, KNP-01: today greet every visitor. Our store and the other 3 Kanpur stores have seen fewer walk-ins.", KNP, /stores/);
});
test("'all 3 Kanpur stores' matches the evidence", () => {
  passes("Area manager, Kanpur: this week ask each store manager what changed locally. All 3 Kanpur stores lost walk-ins, down 18.5% against the rest of the fleet.", KNP);
});
test("a fractional count of people is rejected ('19.1 new customers')", () => {
  fails("Saurabh, today ask Arjun D. for tips. Focus on connecting with your 19.1 new customers to improve your 1.6%.", LOWREP, /whole number/);
});

// ---------- role model ----------
test("role model: telling Karthik to shadow Srinivas is rejected", () => {
  fails("Karthik, review your customer engagement strategy today by shadowing Srinivas B. to understand his methods.", ROLE, /role model/);
});
test("role model: 'observe how Srinivas B. handles' is rejected", () => {
  fails("Karthik, review your process with Srinivas B. today. Observe how Srinivas B. handles client follow-ups.", ROLE, /role model/);
});
test("role model: Karthik teaching the team passes, and others may watch Karthik", () => {
  passes("Store manager, BLR-01: at Saturday's morning huddle, ask Karthik J. to show the team how they follow up with customers. Have Srinivas B. watch Karthik on the floor today.", ROLE);
});

// ---------- duplicated tokens and names ----------
test("LKO-02: 'most bills since 15 since Imran' is rejected", () => {
  fails("Store team, LKO-02: Sumit A. has processed the most bills since 15 since Imran C. is not on the roster since 14 Sep.", LKO, /repeated|date/);
});
test("the same word twice in a row is rejected", () => {
  fails("Store manager, LKO-02: today put put Sumit A. on the floor.", LKO, /repeated word/);
});
test("the same person named twice in one sentence is rejected", () => {
  fails("Faizan, discuss engagement with Mukesh D. as Mukesh D. keeps the highest repeat rate today.", get("2026-10-31:PAT-01:low_repeat:SP1072"), /named twice/);
});

// ---------- dates ----------
test("a date not in the evidence is rejected", () => {
  fails("Store manager, LKO-02: Imran C. has not been on the roster since 20 Sep. Put Sumit A. on the floor today.", LKO, /date not in evidence: 20 Sep/);
});
test("'since' followed by a person instead of a date is rejected", () => {
  fails("Store team, BLR-03: keep 7 people on the floor, not on the roster since Manjunath K. and Vijay N. changed shifts today.", BLR3, /since/);
});
test("dates from the evidence pass", () => {
  passes("Store manager, LKO-02: Imran C. has not been on the roster since 14 Sep. This Saturday and Sunday put Sumit A. on the floor at the busiest hours.", LKO);
});

// ---------- complete sentences ----------
test("a card that stops mid-sentence is rejected", () => {
  fails("Store manager, LKO-02: this Saturday put Sumit A. on the floor and have the newest seller", LKO, /incomplete/);
});
test("a sentence ending on a dangling word is rejected", () => {
  fails("Store manager, LKO-02: this Saturday put Sumit A. on the floor with the.", LKO, /incomplete/);
});

// ---------- wired into validateCard ----------
test("validateCard rejects a semantic error even when every number is allowed", () => {
  const v = validateCard("Store team, BLR-03: this Saturday and Sunday keep the floor count at 6.6 to serve the 791 walk-ins.", BLR3.evidence, BLR3.action);
  assert.equal(v.passed, false);
  assert.ok(v.reasons.some((r) => /headcount/.test(r)));
});

// ---------- prompt: explicit facts for manager cards ----------
import { buildCardPrompt } from "../engine/card-prompt";

test("manager prompt is addressed to the action's owner and carries the action word for word", () => {
  const p = buildCardPrompt(BLR3.evidence, { audience: "am", action: BLR3.action });
  assert.match(p, /Write to Store manager, BLR-03/);
  assert.doesNotMatch(p, /Store team, BLR-03/);
  assert.ok(p.includes(JSON.stringify(BLR3.action.what)), "action text verbatim");
  assert.match(p, /"people_on_floor": 7/);
});

test("manager prompt states the store count in total and the dates", () => {
  const k = buildCardPrompt(KNP.evidence, { audience: "am", action: KNP.action });
  assert.match(k, /"stores_in_city": 3/);
  assert.match(k, /in total, this store included/);
  const l = buildCardPrompt(LKO.evidence, { audience: "am", action: LKO.action });
  assert.match(l, /"dates": \[\s*"14 Sep",\s*"15 Sep"\s*\]/);
});

test("role-model prompt says the role model teaches and never shadows", () => {
  const p = buildCardPrompt(ROLE.evidence, { audience: "am", action: ROLE.action });
  assert.match(p, /"subject_role": "role_model"/);
  assert.match(p, /Karthik J\. is the role model: they teach/);
});

test("salesperson prompt for a role model also says who teaches", () => {
  const p = buildCardPrompt(ROLE.evidence, { audience: "salesperson", action: ROLE.action });
  assert.match(p, /Karthik J\. is the role model: they teach/);
});

test("'since' twice in one sentence is rejected ('Since Imran C. is not on the roster since 14 Sep')", () => {
  fails("Store manager, LKO-02: Since Imran C. is not on the roster since 14 Sep, put Sumit A. on the floor today.", LKO, /since/);
});

test("manager prompt gives the why from the engine's cause and bans filler", () => {
  const p = buildCardPrompt(LKO.evidence, { audience: "am", action: LKO.action });
  assert.match(p, /Second sentence: why/);
  assert.match(p, /from 12\.6% to 10\.4%/);
  assert.match(p, /never "maintain"/);
  assert.match(p, /ensure/);
});
