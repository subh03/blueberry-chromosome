// Where a card's draft came from. The cards table has no column for it, so it is mirrored inside the
// validation jsonb (validation.draft_origin). Pure: no I/O.
import type { ActionCard, DraftOrigin, Evidence } from "../types";

export const INJECTED_LABEL = "Injected test draft (written by the team, not by Gemini):";

export function withDraftOrigin(card: ActionCard, origin: DraftOrigin | undefined): ActionCard {
  const { draft_origin: _a, ...rest } = card;
  const { draft_origin: _b, ...validation } = card.validation;
  void _a; void _b;
  return origin ? { ...rest, draft_origin: origin, validation: { ...validation, draft_origin: origin } } : { ...rest, validation };
}

export function draftOriginOf(card: Pick<ActionCard, "draft_origin" | "validation">): DraftOrigin | undefined {
  return card.draft_origin ?? card.validation?.draft_origin;
}

/** gemini: the text or the rejected draft came from Gemini. injected_test: our stress test. Pure template: unset. */
export function originForCard(card: Pick<ActionCard, "source" | "rejected_draft">): DraftOrigin | undefined {
  if (card.rejected_draft?.startsWith(INJECTED_LABEL)) return "injected_test";
  if (card.source === "gemini" || card.rejected_draft) return "gemini";
  return undefined;
}

/** The stress-test draft: the typical LLM slip (a confident uplift no code computed). Written by us, labelled. */
export function injectedStressDraft(ev: Evidence): { draft: string; labelled: string } {
  const you = ev.subject?.display_name.split(" ")[0] ?? "Team";
  const draft = `${you}, give smaller discounts today, like ${ev.peer?.display_name ?? "your best colleague"}. This will lift your sales by 18% and add ₹40,000 this week.`;
  return { draft, labelled: `${INJECTED_LABEL} ${draft}` };
}

/** The shape the cards table accepts: draft_origin lives only inside validation (no column for it). */
export function toCardRow(card: ActionCard): Omit<ActionCard, "draft_origin"> {
  const origin = draftOriginOf(card);
  const { draft_origin: _o, ...rest } = card;
  void _o;
  return origin ? { ...rest, validation: { ...rest.validation, draft_origin: origin } } : rest;
}
