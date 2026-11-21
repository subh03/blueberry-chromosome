// The AI step plugged into app/api/_lib/make-card.ts (Shubh's AiStep slot).
// makeCard calls buildPrompt -> Gemini -> toText -> validate, twice at most. The AiStep interface has no
// feedback argument, so validate() remembers a rejection per evidence object and the next buildPrompt
// for that same evidence includes the reasons ("retry once with the rejection reasons in the prompt").
import type { CardValidation, Evidence } from "../types";
import { buildCardPrompt, CARD_SCHEMA } from "./card-prompt";
import { validateCard } from "./card-validator";

const lastRejection = new WeakMap<Evidence, { draft: string; reasons: string[] }>();

export const cardAiStep = {
  buildPrompt(evidence: Evidence, audience: "am" | "salesperson"): string {
    return buildCardPrompt(evidence, { audience, feedback: lastRejection.get(evidence) ?? null });
  },
  schema: CARD_SCHEMA as object,
  toText(json: unknown): string {
    const t = (json as { text?: unknown })?.text;
    return typeof t === "string" ? t.trim() : "";
  },
  validate(text: string, evidence: Evidence): CardValidation {
    const v = validateCard(text, evidence);
    if (v.passed) lastRejection.delete(evidence);
    else lastRejection.set(evidence, { draft: text, reasons: v.reasons });
    return v;
  },
};
