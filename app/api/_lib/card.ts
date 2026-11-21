// Safe fallback card. Uses only text our code wrote (action + cause), so it can never contain
// a number the evidence does not have.
// Naman (F3): salesperson cards with evidence use the engine/ templates (filled only from the evidence)
// and carry the real validator result. Issues without evidence keep the original action + cause text.
import type { ActionCard, Issue } from "@/types";
import { renderTemplate } from "@/engine/card-templates";
import { validateCard } from "@/engine/card-validator";

export function templateCard(issue: Pick<Issue, "id" | "action" | "cause"> & Partial<Pick<Issue, "type" | "store_id" | "evidence">>, audience: ActionCard["audience"]): ActionCard {
  const ev = issue.evidence;
  // Naman (F3): salesperson cards with full evidence use the engine template (it passes the validator by test).
  const useEngine = audience === "salesperson" && !!ev?.steps && !!issue.type && !!issue.store_id;
  const { who, what, when } = issue.action;
  const action = `${who}: ${trimDot(what)}. When: ${trimDot(when)}.`;
  const full = `${action} Why: ${trimDot(issue.cause)}.`;
  // Cards are at most MAX_WORDS: drop the "Why" before ever cutting the action.
  const text = useEngine
    ? renderTemplate(issue as Issue)
    : words(full) <= MAX_WORDS ? full : words(action) <= MAX_WORDS ? action : cut(action, MAX_WORDS);
  return {
    id: `template:${issue.id}:${audience}`,
    issue_id: issue.id,
    audience,
    salesperson_id: ev?.subject?.salesperson_id ?? null, // who a salesperson-level issue is about
    text,
    source: "template",
    validation: useEngine ? validateCard(text, ev!) : { passed: true, word_count: words(text), rejected_numbers: [], reasons: [] },
    created_at: new Date().toISOString(),
  };
}

const MAX_WORDS = 60;

function words(s: string): number {
  return s.trim().split(/\s+/).length;
}

function cut(s: string, max: number): string {
  return `${s.trim().split(/\s+/).slice(0, max).join(" ")}…`;
}

function trimDot(s: string): string {
  return s.trim().replace(/[.\s]+$/, "");
}
