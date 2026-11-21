// The Gemini prompt for one action card. Gemini writes words only; every number comes from the evidence.
import type { Evidence } from "../types";

/** Gemini responseSchema (OpenAPI subset, as in the generateContent docs). */
export const CARD_SCHEMA = {
  type: "OBJECT",
  properties: {
    text: { type: "STRING", description: "The card, at most 60 words." },
    numbers_used: { type: "ARRAY", items: { type: "STRING" }, description: "Every number in text, copied exactly from allowedNumbers." },
  },
  required: ["text", "numbers_used"],
};

export interface PromptOptions {
  audience?: "am" | "salesperson";
  feedback?: { draft: string; reasons: string[] } | null; // the previous draft and why it was rejected
  language?: "en" | "hi";
}

/** Only what the writer needs: no formulas, no row counts. */
function facts(ev: Evidence) {
  return {
    store_id: ev.store_id,
    problem: ev.type,
    cause: ev.cause,
    salesperson: ev.subject?.display_name ?? null,
    peer: ev.peer ? { name: ev.peer.display_name, why: ev.peer.why } : null,
    numbers: ev.steps.map((s) => ({ what: s.label, value: s.display, ...(s.compare_to ? { compare_to: `${s.compare_to.label}: ${s.compare_to.display}` } : {}) })),
  };
}

export function buildCardPrompt(ev: Evidence, o: PromptOptions = {}): string {
  const who = ev.subject
    ? `Write to ${ev.subject.display_name} (call them by first name only) as "you".`
    : `Write to the whole store team: start with "Store team, ${ev.store_id}:".`;
  const peerRule = ev.peer
    ? `Name ${ev.peer.display_name} (a colleague in the same store) and say what to learn from them or do with them. Use their name, never "he" or "she".`
    : "There is no colleague to name. Do not invent one.";
  const lang = o.language === "hi"
    ? "Write in simple Hindi (Devanagari). Keep names, store codes and every number exactly as written in allowedNumbers."
    : "Write in plain Indian English.";

  const lines = [
    "You write one short action card for a Manyavar store, read on a phone on the shop floor.",
    who,
    "",
    "Rules (a program checks every one; a card that breaks any rule is thrown away):",
    "1. At most 60 words. Aim for 35 to 50.",
    "2. One behaviour and one action the person can do today with the people and stock already in the store. Put the action first.",
    '3. Say when: use "today", "this Saturday and Sunday", "from today" or "before closing". No clock times.',
    `4. ${peerRule}`,
    "5. Numbers: use ONLY values from allowedNumbers, copied exactly as written there (same decimals, same % or ₹). No other digits, no rounding, no written-out numbers (two, ten, dozen), no years, no clock times, no estimates of extra sales. One or two numbers is enough.",
    "6. Name nobody except the people in the evidence. Store codes like LKO-02 are fine.",
    "7. End on the action or the number. No closing sentence about benefits, margins, loyalty or \"improving\" anything.",
    "8. Tone: polite and direct, like a good store manager. No blame, no hype, no emojis, no exclamation marks. Say \"not on the roster since\", never \"resigned\" or \"left the company\".",
    `9. ${lang}`,
    "",
    `allowedNumbers: ${JSON.stringify(ev.allowedNumbers)}`,
    "",
    `Evidence (computed by our code; do not compute anything new):\n${JSON.stringify(facts(ev), null, 1)}`,
    "",
    'Return JSON: {"text": the card, "numbers_used": every number you used, copied from allowedNumbers}.',
  ];
  if (o.feedback) {
    lines.push(
      "",
      `Your previous draft was rejected because: ${o.feedback.reasons.join("; ")}.`,
      `Rejected draft: ${JSON.stringify(o.feedback.draft)}`,
      "Write a new card that fixes every reason above.",
    );
  }
  return lines.join("\n");
}
