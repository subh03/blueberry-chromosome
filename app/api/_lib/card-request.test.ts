// Run: npx tsx --test app/api/_lib/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ActionCard } from "@/types";
import { parseCardId, parseCardRequest, pickSavedCard } from "./card-request";

test("parseCardRequest reads card_id for a card by id", () => {
  assert.deepEqual(parseCardRequest({ card_id: "stress-test:2026-10-31:PAT-01:x:salesperson" }), { kind: "id", id: "stress-test:2026-10-31:PAT-01:x:salesperson" });
});

test("parseCardRequest reads issue_id with audience, defaulting to salesperson", () => {
  assert.deepEqual(parseCardRequest({ issue_id: "i1" }), { kind: "issue", issue_id: "i1", audience: "salesperson" });
  assert.deepEqual(parseCardRequest({ issue_id: "i1", audience: "am" }), { kind: "issue", issue_id: "i1", audience: "am" });
});

test("parseCardRequest rejects bad input", () => {
  for (const bad of [null, "x", {}, { issue_id: "" }, { issue_id: "i", audience: "boss" }, { card_id: 5 }, { card_id: "a b" }, { card_id: "x".repeat(300) }]) {
    assert.equal(parseCardRequest(bad), null, JSON.stringify(bad));
  }
});

test("parseCardId accepts ids made of letters, digits and : _ . - only", () => {
  assert.equal(parseCardId("gemini:2026-10-31:LKO-02:staff_absent_or_left:am"), "gemini:2026-10-31:LKO-02:staff_absent_or_left:am");
  assert.equal(parseCardId("../etc"), null);
  assert.equal(parseCardId("a/b"), null);
  assert.equal(parseCardId(null), null);
});

const card = (id: string, audience: ActionCard["audience"], created_at: string) => ({ id, audience, created_at }) as ActionCard;

test("pickSavedCard prefers the newest card for the asked audience", () => {
  const cards = [card("old", "salesperson", "2026-11-21T08:00:00Z"), card("new", "salesperson", "2026-11-21T09:00:00Z"), card("mgr", "am", "2026-11-21T10:00:00Z")];
  assert.equal(pickSavedCard(cards, "salesperson")?.id, "new");
});

test("pickSavedCard falls back to the newest card for the issue in the other audience", () => {
  assert.equal(pickSavedCard([card("mgr", "am", "2026-11-21T10:00:00Z")], "salesperson")?.id, "mgr");
});

test("pickSavedCard never serves the stress-test card for an issue, and returns null when nothing fits", () => {
  assert.equal(pickSavedCard([card("stress-test:i1:salesperson", "salesperson", "2026-11-21T11:00:00Z")], "salesperson"), null);
  assert.equal(pickSavedCard([], "am"), null);
});

test("pickSavedCard never answers a manager request with the salesperson's own card", () => {
  assert.equal(pickSavedCard([card("sp", "salesperson", "2026-11-21T10:00:00Z")], "am"), null);
});

test("pickSavedCard compares times, not strings (whole seconds vs fractions, Z vs +00:00)", () => {
  const cards = [card("whole", "am", "2026-11-21T08:00:00+00:00"), card("later", "am", "2026-11-21T08:00:00.5+00:00"), card("zulu", "am", "2026-11-21T07:59:59Z")];
  assert.equal(pickSavedCard(cards, "am")?.id, "later");
});

test("parseCardRequest rejects a body that sends both card_id and issue_id", () => {
  assert.equal(parseCardRequest({ card_id: "card-1", issue_id: "i1" }), null);
});

// H5: /api/run must never overwrite (or shadow, since the newest card is served) a protected card.
import { isProtectedCard, needsNewCard } from "./card-request";

const withValidation = (id: string, audience: ActionCard["audience"], validation: object) =>
  ({ id, audience, created_at: "2026-11-21T09:00:00Z", validation }) as unknown as ActionCard;

test("isProtectedCard: team-edited cards and the injected stress-test card are protected", () => {
  assert.equal(isProtectedCard(withValidation("gemini:i1:am", "am", { team_edit: { gemini_text: "x", why: "y" } })), true);
  assert.equal(isProtectedCard(withValidation("stress-test:i1:salesperson", "salesperson", { draft_origin: "injected_test" })), true);
  assert.equal(isProtectedCard(withValidation("gemini:i1:salesperson", "salesperson", { draft_origin: "gemini" })), false);
});

test("needsNewCard: no new card when the issue already has one for that audience (so a team edit is never shadowed)", () => {
  assert.equal(needsNewCard([withValidation("gemini:i1:am", "am", { team_edit: { gemini_text: "x", why: "y" } })], "am"), false);
  assert.equal(needsNewCard([withValidation("gemini:i1:salesperson", "salesperson", {})], "salesperson"), false);
});

test("needsNewCard: a card is made only when none exists for that audience; the stress card does not count", () => {
  assert.equal(needsNewCard([], "am"), true);
  assert.equal(needsNewCard([withValidation("gemini:i1:salesperson", "salesperson", {})], "am"), true);
  assert.equal(needsNewCard([withValidation("stress-test:i1:salesperson", "salesperson", { draft_origin: "injected_test" })], "salesperson"), true);
});
