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
