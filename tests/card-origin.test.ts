import { test } from "node:test";
import assert from "node:assert/strict";
import { withDraftOrigin, draftOriginOf, originForCard, injectedStressDraft, INJECTED_LABEL, toCardRow } from "../engine/card-origin";
import { validateCard } from "../engine/card-validator";
import type { ActionCard, Evidence } from "../types";

const card = (over: Partial<ActionCard> = {}): ActionCard => ({
  id: "c", issue_id: "i", audience: "salesperson", salesperson_id: "SP1", text: "t", source: "template",
  validation: { passed: true, word_count: 1, rejected_numbers: [], reasons: [] }, created_at: "2026-11-21T00:00:00Z", ...over,
});

const ev: Evidence = {
  store_id: "PAT-01", as_of: "2026-10-31", lever: "bigger_baskets", type: "discount_above_norm",
  steps: [{ label: "Manoj N.: discount off MRP", value: 7.1, display: "7.1%", formula: "f", rows: 1, compare_to: { label: "Rest of PAT-01", value: 1.8, display: "1.8%" } }],
  cause: "c", peer: { salesperson_id: "SP2", display_name: "Asha R.", why: "w" }, subject: { salesperson_id: "SP1", display_name: "Manoj N." },
  allowedNumbers: ["7.1%", "1.8%"],
};

test("withDraftOrigin sets the card field and mirrors it inside the validation JSON (no DB column needed)", () => {
  const c = withDraftOrigin(card(), "injected_test");
  assert.equal(c.draft_origin, "injected_test");
  assert.equal(c.validation.draft_origin, "injected_test");
  assert.equal(draftOriginOf({ ...c, draft_origin: undefined }), "injected_test", "read back from validation alone");
});

test("withDraftOrigin(undefined) leaves a pure template with no origin anywhere", () => {
  const c = withDraftOrigin(withDraftOrigin(card(), "gemini"), undefined);
  assert.equal("draft_origin" in c, false);
  assert.equal("draft_origin" in c.validation, false);
  assert.equal(draftOriginOf(c), undefined);
});

test("originForCard: Gemini text or a rejected Gemini draft -> gemini; pure template -> unset", () => {
  assert.equal(originForCard(card({ source: "gemini" })), "gemini");
  assert.equal(originForCard(card({ source: "template", rejected_draft: "a Gemini draft" })), "gemini");
  assert.equal(originForCard(card()), undefined);
});

test("originForCard never calls an injected draft Gemini's", () => {
  assert.equal(originForCard(card({ rejected_draft: `${INJECTED_LABEL} bad 18%` })), "injected_test");
});

test("the injected stress draft is labelled and really fails the validator on its invented numbers", () => {
  const s = injectedStressDraft(ev);
  assert.ok(s.labelled.startsWith(INJECTED_LABEL));
  const v = validateCard(s.draft, ev);
  assert.equal(v.passed, false);
  assert.deepEqual(v.rejected_numbers, ["18%", "₹40,000"]);
});

test("toCardRow drops the top-level draft_origin (no DB column) but keeps it inside validation", () => {
  const row = toCardRow(withDraftOrigin(card(), "injected_test"));
  assert.equal("draft_origin" in row, false);
  assert.equal(row.validation.draft_origin, "injected_test");
});
