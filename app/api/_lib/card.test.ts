// Run: npx tsx --test app/api/_lib/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Issue } from "@/types";
import { templateCard } from "./card";

const issue = {
  id: "2026-10-31:LKO-02:staff_absent_or_left",
  store_id: "LKO-02",
  cause: "Top seller not on roster since 2026-09-14",
  action: { who: "Store manager, LKO-02", what: "Pair the newest seller with your best closer", when: "Today, 4-8 pm" },
} as Issue;

test("templateCard writes only code-made text from the issue (no invented numbers) and passes validation", () => {
  const card = templateCard(issue, "salesperson");
  assert.equal(card.text, "Store manager, LKO-02: Pair the newest seller with your best closer. When: Today, 4-8 pm. Why: Top seller not on roster since 2026-09-14.");
  assert.equal(card.source, "template");
  assert.equal(card.issue_id, issue.id);
  assert.deepEqual(card.validation, { passed: true, word_count: card.text.split(/\s+/).length, rejected_numbers: [], reasons: [] });
});

test("templateCard names the salesperson from evidence.subject, and null when there is none", () => {
  const withSubject = { ...issue, evidence: { subject: { salesperson_id: "SP1125", display_name: "A B." } } } as unknown as Issue;
  assert.equal(templateCard(withSubject, "salesperson").salesperson_id, "SP1125");
  assert.equal(templateCard({ ...issue, evidence: {} } as unknown as Issue, "salesperson").salesperson_id, null);
});

test("templateCard stays within 60 words: drops the 'Why' part when the cause would push it over", () => {
  const long = { ...issue, cause: Array.from({ length: 50 }, (_, i) => `word${i}`).join(" ") } as Issue;
  const card = templateCard(long, "salesperson");
  assert.ok(card.validation.word_count <= 60, `got ${card.validation.word_count} words`);
  assert.equal(card.validation.word_count, card.text.split(/\s+/).length);
  assert.equal(card.text, "Store manager, LKO-02: Pair the newest seller with your best closer. When: Today, 4-8 pm.");
});

test("templateCard cuts an over-long action at 60 words and marks the cut", () => {
  const huge = { ...issue, action: { who: "SM", what: Array.from({ length: 80 }, (_, i) => `w${i}`).join(" "), when: "now" } } as Issue;
  const card = templateCard(huge, "salesperson");
  assert.equal(card.validation.word_count, 60);
  assert.ok(card.text.endsWith("…"));
});
