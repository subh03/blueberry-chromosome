// Safe fallback card. Uses only text our code wrote (action + cause), so it can never contain
// a number the evidence does not have.
// TODO(Naman): swap for the engine/ templates when they exist.
import type { ActionCard, Issue } from "@/types";

export function templateCard(issue: Pick<Issue, "id" | "action" | "cause" | "evidence">, audience: ActionCard["audience"]): ActionCard {
  const { who, what, when } = issue.action;
  const action = `${who}: ${trimDot(what)}. When: ${trimDot(when)}.`;
  const full = `${action} Why: ${trimDot(issue.cause)}.`;
  // Cards are at most MAX_WORDS: drop the "Why" before ever cutting the action.
  const text = words(full) <= MAX_WORDS ? full : words(action) <= MAX_WORDS ? action : cut(action, MAX_WORDS);
  return {
    id: `template:${issue.id}:${audience}`,
    issue_id: issue.id,
    audience,
    salesperson_id: issue.evidence?.subject?.salesperson_id ?? null, // who a salesperson-level issue is about
    text,
    source: "template",
    validation: { passed: true, word_count: words(text), rejected_numbers: [], reasons: [] },
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
