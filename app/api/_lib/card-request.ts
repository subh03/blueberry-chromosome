// Pure helpers for /api/card: what the request asks for, and which saved card answers it.
import type { ActionCard } from "@/types";

type Audience = ActionCard["audience"];
export type CardRequest = { kind: "id"; id: string } | { kind: "issue"; issue_id: string; audience: Audience };

const CARD_ID = /^[A-Za-z0-9:_.-]{1,250}$/;
const STRESS_PREFIX = "stress-test:";

/** A card id is letters, digits and `: _ . -` only (no slashes, no spaces), at most 250 chars. */
export function parseCardId(value: unknown): string | null {
  return typeof value === "string" && CARD_ID.test(value) && !value.includes("..") ? value : null;
}

/** POST body: `{ card_id }` for one stored card, or `{ issue_id, audience? }` for an issue's card. */
export function parseCardRequest(body: unknown): CardRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const { card_id, issue_id, audience = "salesperson" } = body as Record<string, unknown>;
  if (card_id !== undefined && issue_id !== undefined) return null; // ambiguous: ask for one or the other
  if (card_id !== undefined) {
    const id = parseCardId(card_id);
    return id ? { kind: "id", id } : null;
  }
  if (typeof issue_id !== "string" || issue_id.length === 0 || issue_id.length > 200) return null;
  if (audience !== "am" && audience !== "salesperson") return null;
  return { kind: "issue", issue_id, audience };
}

/**
 * The saved card to show for an issue: the newest one for the asked audience. A salesperson request may
 * fall back to the manager card (manager-level issues only have one), never the other way round, because
 * a salesperson card is addressed to that seller by name.
 * The stress-test card is only ever served by id, never for an issue.
 */
export function pickSavedCard(cards: ActionCard[], audience: Audience): ActionCard | null {
  const real = cards
    .filter((c) => !c.id.startsWith(STRESS_PREFIX))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const exact = real.find((c) => c.audience === audience);
  if (exact) return exact;
  return audience === "salesperson" ? (real.find((c) => c.audience === "am") ?? null) : null;
}

/** Cards /api/run must never overwrite or shadow: a team-edited card, or the injected stress-test card. */
export function isProtectedCard(card: ActionCard): boolean {
  const v = card.validation as ActionCard["validation"] & { team_edit?: unknown; draft_origin?: string };
  return Boolean(v?.team_edit) || v?.draft_origin === "injected_test" || card.id.startsWith(STRESS_PREFIX);
}

/**
 * Whether /api/run should make a card for this issue and audience. Only when no real card exists yet:
 * /api/card serves the newest card, so a fresh one would shadow a stored (possibly team-edited) card.
 * The stress-test card does not count; a new card never replaces it (different row, served only by id).
 */
export function needsNewCard(existing: ActionCard[], audience: Audience): boolean {
  return !existing.some((c) => c.audience === audience && !c.id.startsWith(STRESS_PREFIX));
}
