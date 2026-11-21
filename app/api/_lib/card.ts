// Safe fallback card. Uses only text our code wrote (action + cause), so it can never contain
// a number the evidence does not have.
// TODO(Naman): swap for the engine/ templates when they exist.
import type { ActionCard, Issue } from "@/types";

export function templateCard(issue: Pick<Issue, "id" | "action" | "cause">, audience: ActionCard["audience"]): ActionCard {
  const { who, what, when } = issue.action;
  const text = `${who}: ${trimDot(what)}. When: ${trimDot(when)}. Why: ${trimDot(issue.cause)}.`;
  return {
    id: `template:${issue.id}:${audience}`,
    issue_id: issue.id,
    audience,
    salesperson_id: null,
    text,
    source: "template",
    validation: { passed: true, word_count: text.split(/\s+/).length, rejected_numbers: [], reasons: [] },
    created_at: new Date().toISOString(),
  };
}

function trimDot(s: string): string {
  return s.trim().replace(/[.\s]+$/, "");
}
