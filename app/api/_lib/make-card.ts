// One card for one issue: Gemini (structured JSON, retry once) under the AI_TIMEOUT_MS deadline,
// checked by Naman's number validator. Any failure, timeout or rejection -> template card.
import type { ActionCard, CardValidation, Evidence, Issue } from "@/types";
import { generateJson } from "./gemini";
import { templateCard } from "./card";
import { aiTimeoutMs, withTimeout } from "./with-timeout";

type Audience = ActionCard["audience"];

/** What engine/ must provide. Naman owns the prompt text and the validator. */
export interface AiStep {
  buildPrompt(evidence: Evidence, audience: Audience): string;
  schema: object; // Gemini responseSchema for the card JSON
  toText(json: unknown): string; // pull the card text out of the model JSON
  validate(text: string, evidence: Evidence): CardValidation;
}

// TODO(Naman): wire the engine/ prompt + validator here when they exist, e.g.
//   import { aiStep as engineAiStep } from "@/engine/ai";  export const aiStep = engineAiStep;
// While this is null, every card is the template card (source "template").
export const aiStep = null as AiStep | null;

export interface CardDeps {
  aiStep: AiStep | null;
  apiKey: string | undefined;
  model: string | undefined;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

function defaultDeps(): CardDeps {
  return { aiStep, apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL, timeoutMs: aiTimeoutMs() };
}

export async function makeCard(issue: Issue, audience: Audience, deps: CardDeps = defaultDeps()): Promise<ActionCard> {
  const { aiStep: step, apiKey, model, timeoutMs, fetchImpl } = deps;
  if (!step || !apiKey || !model) return templateCard(issue, audience);

  try {
    return await withTimeout(async (signal) => {
      let last: { text: string; validation: CardValidation } | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const json = await generateJson({ apiKey, model, prompt: step.buildPrompt(issue.evidence, audience), schema: step.schema, signal, fetchImpl });
        const text = step.toText(json);
        const validation = step.validate(text, issue.evidence);
        if (validation.passed) {
          return { ...templateCard(issue, audience), id: `gemini:${issue.id}:${audience}`, text, source: "gemini" as const, validation };
        }
        last = { text, validation };
      }
      // Both drafts failed the validator: show the template, keep the rejected draft for the trust beat.
      return { ...templateCard(issue, audience), rejected_draft: last!.text, validation: last!.validation };
    }, timeoutMs);
  } catch (err) {
    console.warn("[card] AI step failed, using template:", err instanceof Error ? err.message : err);
    return templateCard(issue, audience);
  }
}
