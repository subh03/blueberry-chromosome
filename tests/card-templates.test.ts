import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { renderTemplate } from "../engine/card-templates";
import { validateCard } from "../engine/card-validator";
import { buildCardPrompt, CARD_SCHEMA } from "../engine/card-prompt";
import { cardAiStep } from "../engine/card-ai";
import { detectAll } from "../engine/detectors";
import { buildWorld, isWeekend, sellers, type StoreSpec } from "./fixtures/world";
import type { Issue, IssueType } from "../types";

const ALL_TYPES: IssueType[] = [
  "staff_absent_or_left", "understaffed_busy_days", "conversion_drop_footfall_steady", "city_slowdown",
  "missing_pair", "category_avoidance", "discount_above_norm", "low_repeat", "role_model",
];

/** One planted problem per issue type (same shapes as the detector tests, smaller). */
function worldIssues(): Issue[] {
  const flat = (n: number) => () => n;
  const from = (d: string, a: number, b: number) => (x: string) => (x > d ? b : a);
  const s = (store_id: string, city: string, state: string, extra: Partial<StoreSpec> = {}): StoreSpec => ({
    store_id, city, state, area_manager_id: `AM-${city}`, footfall: flat(40), conv: flat(13), sellers: sellers(`${store_id}-`, 6), ...extra,
  });
  const w = buildWorld({
    from: "2025-05-01", to: "2026-10-31", diwali: ["2025-10-20", "2026-11-08"],
    stores: [
      s("L1", "Lko", "UP"),
      s("L2", "Lko", "UP", { conv: from("2026-09-14", 13, 9.5), sellers: sellers("L2-", 6, [{ name: "Top S.", weight: 4, lastRoster: "2026-09-14" }]) }),
      s("L3", "Lko", "UP", { conv: from("2026-07-31", 13, 9.5) }),
      s("L4", "Lko", "UP", {
        footfall: flat(60),
        sellers: sellers("L4-", 8, [{}, { name: "Nopair A.", jacketP: 0.03 }, { name: "Noindo B.", indoP: 0.003 }, { name: "Discount C.", discount: 0.08 },
          { name: "Model D.", repeatP: 0.35 }, {}, { name: "Lowrep F.", repeatP: 0 }]),
      }),
      ...["K1", "K2", "K3"].map((id) => s(id, "Knp", "UP", { footfall: from("2026-10-03", 40, 32) })),
      s("B1", "Blr", "KA"), s("B2", "Blr", "KA"), s("B4", "Blr", "KA"),
      s("B3", "Blr", "KA", {
        conv: (d) => (d > "2026-07-31" && isWeekend(d) ? 9 : 13),
        sellers: sellers("B3-", 8, [{ name: "Weekend A.", present: (d) => !(d > "2026-07-31" && isWeekend(d)) }, { name: "Weekend B.", present: (d) => !(d > "2026-07-31" && isWeekend(d)) }]),
      }),
    ],
  });
  return detectAll({ asOf: "2026-10-31", ...w }).issues;
}

const synthetic = worldIssues();
const real: Issue[] = existsSync("data/generated/issues.json") ? JSON.parse(readFileSync("data/generated/issues.json", "utf8")).issues : [];

test("the synthetic world covers every issue type", () => {
  assert.deepEqual([...new Set(synthetic.map((i) => i.type))].sort(), [...ALL_TYPES].sort());
});

test("every template, for every issue type, passes the validator (synthetic + real issues)", () => {
  for (const i of [...synthetic, ...real]) {
    const text = renderTemplate(i);
    const v = validateCard(text, i.evidence);
    assert.ok(v.passed, `${i.id}: ${v.reasons.join(" | ")}\n${text}`);
  }
});

test("salesperson templates speak to the salesperson by first name and name the peer", () => {
  for (const i of synthetic.filter((x) => x.evidence.subject)) {
    const text = renderTemplate(i);
    const first = i.evidence.subject!.display_name.split(" ")[0];
    assert.ok(text.startsWith(`${first},`), text);
    assert.ok(text.includes(i.evidence.peer!.display_name), text);
  }
});

test("a template never uses a number the evidence lacks, even for a bare issue (fallback text)", () => {
  const bare = { id: "x", type: "missing_pair", store_id: "S1", cause: "Cause.", action: { who: "SM", what: "Do it", when: "Today" },
    evidence: { store_id: "S1", steps: [], allowedNumbers: [], peer: null, cause: "Cause." } } as unknown as Issue;
  const text = renderTemplate(bare);
  assert.ok(text.length > 0);
  assert.deepEqual(validateCard(text, bare.evidence).rejected_numbers, []);
});

// ---------- prompt + AI step ----------
test("the prompt carries the rules, the evidence and the exact allowed numbers", () => {
  const i = synthetic.find((x) => x.type === "low_repeat")!;
  const p = buildCardPrompt(i.evidence);
  for (const want of ["60 words", "allowedNumbers", "today", i.evidence.peer!.display_name, ...i.evidence.allowedNumbers]) assert.ok(p.includes(want), want);
  assert.deepEqual(CARD_SCHEMA.required, ["text", "numbers_used"]);
});

test("the AI step retries with the rejection reasons in the prompt", () => {
  const i = synthetic.find((x) => x.type === "missing_pair")!;
  const first = cardAiStep.buildPrompt(i.evidence, "salesperson");
  assert.ok(!first.includes("was rejected"));
  const v = cardAiStep.validate("Show more jackets. It adds ₹99,999.", i.evidence);
  assert.equal(v.passed, false);
  const second = cardAiStep.buildPrompt(i.evidence, "salesperson");
  assert.ok(second.includes("was rejected"), second);
  assert.ok(second.includes("₹99,999"));
  assert.equal(cardAiStep.toText({ text: "  hi  ", numbers_used: [] }), "hi");
});
