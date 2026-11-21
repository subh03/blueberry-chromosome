import { test } from "node:test";
import assert from "node:assert/strict";
import { extractNumbers, numberKey, validateCard, countWords } from "../engine/card-validator";
import type { Evidence } from "../types";

const ev: Evidence = {
  store_id: "LKO-01",
  as_of: "2026-10-31",
  lever: "more_repeat",
  type: "low_repeat",
  steps: [
    { label: "Vikram S.: customers who came back, all time", value: 3.14, display: "3.1%", formula: "f", rows: 986,
      compare_to: { label: "Rest of LKO-01", value: 8.2, display: "8.2%" } },
    { label: "Average bill value in LKO-01, last 12 months", value: 9988, display: "₹9,988", formula: "f", rows: 5093 },
    { label: "₹ at stake, next 28 days", value: 22400, display: "₹22,400", formula: "f", rows: 986 },
  ],
  cause: "Only 3.1% of Vikram S.'s customers come back; the rest of LKO-01: 8.2%.",
  peer: { salesperson_id: "SP2", display_name: "Asha R.", why: "Best repeat rate in LKO-01" },
  subject: { salesperson_id: "SP1", display_name: "Vikram S." },
  allowedNumbers: ["3.1%", "8.2%", "5.0 pts", "5.0", "₹9,988", "₹22,400", "28", "12"],
};

const GOOD = "Vikram, 3.1% of your customers come back; the rest of LKO-01 manages 8.2%. Today, ask Asha R. how they follow up, then take the number on every bill and send a thank-you message before closing.";

// ---------- extracting numbers ----------
test("store and staff IDs are not numbers", () => {
  assert.deepEqual(extractNumbers("LKO-02, SP1018, KNP-03 and B5 are codes"), []);
});

test("digits, percentages, rupees, k-suffix and written numbers are found as written", () => {
  assert.deepEqual(extractNumbers("₹40,000 or 40k, 18% or 18 %, 3.1 and two weeks"), ["₹40,000", "40k", "18%", "18 %", "3.1", "two"]);
});

test("'one' is not treated as a number (one thing, one action)", () => {
  assert.deepEqual(extractNumbers("Do one thing today, one customer at a time"), []);
});

test("ranges give both ends, years and '2 weeks' are numbers", () => {
  assert.deepEqual(extractNumbers("4-8 pm since 2025 for 2 weeks"), ["4", "8", "2025", "2"]);
});

test("Hindi digits are read as numbers", () => {
  assert.deepEqual(extractNumbers("आज ३.१% ग्राहक"), ["३.१%"]);
});

// ---------- normalising ----------
test("formats that mean the same number get the same key", () => {
  assert.equal(numberKey("18 %"), numberKey("18%"));
  assert.equal(numberKey("8.20%"), numberKey("8.2%"));
  assert.equal(numberKey("18 per cent"), numberKey("18%"));
  for (const x of ["40k", "40K", "Rs 40,000", "40,000", "₹40000", "INR 40,000", "₹40 thousand"]) assert.equal(numberKey(x), numberKey("₹40,000"), x);
  assert.equal(numberKey("₹2.2 lakh"), numberKey("₹2,20,000"));
  assert.equal(numberKey("5 points"), numberKey("5.0 pts"));
  assert.equal(numberKey("३.१%"), numberKey("3.1%"));
  assert.equal(numberKey("two"), numberKey("2"));
});

test("a bare decimal is not the same as a percentage", () => {
  assert.notEqual(numberKey("3.1"), numberKey("3.1%"));
});

// ---------- the validator ----------
test("a good card passes", () => {
  const v = validateCard(GOOD, ev);
  assert.deepEqual(v.reasons, []);
  assert.equal(v.passed, true);
  assert.equal(v.word_count, countWords(GOOD));
});

test("over 60 words is rejected", () => {
  const v = validateCard(GOOD + " Keep going." + " Please do this well.".repeat(8), ev);
  assert.equal(v.passed, false);
  assert.ok(v.reasons.includes("over 60 words"));
});

test("a number not in the evidence is rejected and listed as written", () => {
  const v = validateCard(GOOD + " This adds ₹40,000 and lifts repeat by 18%.", ev);
  assert.equal(v.passed, false);
  assert.deepEqual(v.rejected_numbers, ["₹40,000", "18%"]);
  assert.ok(v.reasons.includes("number not in evidence: ₹40,000"));
});

test("allowed numbers pass in another format (₹22.4k, 8.20 %)", () => {
  assert.equal(validateCard(GOOD.replace("8.2%", "8.20 %") + " It is worth ₹22.4k.", ev).passed, true);
});

test("rounding is not allowed: 8% is not 8.2%", () => {
  assert.deepEqual(validateCard(GOOD.replace("8.2%", "8%"), ev).rejected_numbers, ["8%"]);
});

test("percent vs decimal: 3.1 without % is rejected", () => {
  assert.deepEqual(validateCard(GOOD.replace("3.1%", "3.1"), ev).rejected_numbers, ["3.1"]);
});

test("years, '2 weeks', 'two weeks' and clock times are rejected unless in the evidence", () => {
  assert.deepEqual(validateCard(GOOD + " Since 2025, for 2 weeks, two weeks, by 6 pm.", ev).rejected_numbers, ["2025", "2", "two", "6"]);
});

test("a range is fine only if the evidence has it", () => {
  assert.deepEqual(validateCard(GOOD + " Best at 4-8 pm.", ev).rejected_numbers, ["4", "8"]);
  assert.equal(validateCard(GOOD + " Best at 4-8 pm.", { ...ev, allowedNumbers: [...ev.allowedNumbers, "4-8 pm"] }).passed, true);
});

test("store IDs in the text do not count as numbers", () => {
  assert.deepEqual(validateCard(GOOD.replace("LKO-01", "LKO-01 (not KNP-03)"), ev).rejected_numbers, []);
});

test("naming someone who is not in the evidence is rejected", () => {
  const v = validateCard(GOOD.replace("ask Asha R.", "ask Asha R. and Ravi"), ev);
  assert.ok(v.reasons.includes("names someone not in the evidence: Ravi"), v.reasons.join(" | "));
});

test("known shop words, days and categories are not mistaken for names", () => {
  const v = validateCard(GOOD + " On Saturday show a Safa and Mojari with every Sherwani at Manyavar.", ev);
  assert.deepEqual(v.reasons, []);
});

test("no same-store peer named is rejected", () => {
  assert.ok(validateCard(GOOD.replace("ask Asha R. how they follow up, then ", ""), ev).reasons.includes("no same-store peer named"));
});

test("a peer's first name alone counts as naming them", () => {
  assert.equal(validateCard(GOOD.replace("Asha R.", "Asha"), ev).passed, true);
});

test("no action is rejected", () => {
  assert.ok(validateCard("Vikram, 3.1% of your customers come back. Asha R. is great at it today.", ev).reasons.includes("no action for today"));
});

test("no time (today / by …) is rejected", () => {
  const v = validateCard(GOOD.replace("Today, ", "").replace(" before closing", ""), ev);
  assert.ok(v.reasons.includes("no time (today / by …)"), v.reasons.join(" | "));
});

test("store-level evidence without a peer skips the peer rule", () => {
  const v = validateCard("Keep the floor full today and ask each seller to greet walk-ins.", { ...ev, peer: null, subject: null });
  assert.ok(!v.reasons.includes("no same-store peer named"), v.reasons.join(" | "));
});

// Found in the first real Gemini run (21 Nov): these were validator false alarms, not Gemini mistakes.
test("category plurals (Kurta Sets) are not mistaken for names", () => {
  const v = validateCard(GOOD + " Suggest a jacket with every Kurta Set and watch how Asha pairs Kurta Sets.", ev);
  assert.ok(!v.reasons.some((r) => r.startsWith("names someone")), v.reasons.join(" | "));
});

test("observe, shadow, discuss and partner with count as actions", () => {
  for (const verb of ["observe Asha R. on the floor", "shadow Asha R.", "discuss follow-ups with Asha R.", "partner with Asha R."]) {
    const v = validateCard(`Vikram, ${verb} today. 3.1% of your customers come back.`, ev);
    assert.ok(!v.reasons.includes("no action for today"), `${verb}: ${v.reasons.join(" | ")}`);
  }
});

