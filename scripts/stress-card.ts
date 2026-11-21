// npm run cards:stress — ONE clearly labelled stress-test card for the "draft rejected, template used" demo beat.
// Why it exists: in both real runs (37 Gemini drafts, 21 Nov) Gemini never used a number outside the evidence,
// so there is no real rejection to show. This card's draft is WRITTEN BY US, not by Gemini, and says so in its
// text and id. The validator result on it is real. The UI and the video must label it "injected test draft".
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { ActionCard, Issue } from "../types";
import { validateCard } from "../engine/card-validator";
import { templateCard } from "../app/api/_lib/card";

export const INJECTED_LABEL = "Injected test draft (written by the team, not by Gemini):";
const ISSUE_ID = "2026-10-31:PAT-01:discount_above_norm:SP1064";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);
const { issues } = JSON.parse(readFileSync("data/generated/issues.json", "utf8")) as { issues: Issue[] };
const issue = issues.find((i) => i.id === ISSUE_ID);
if (!issue?.evidence.subject || !issue.evidence.peer) throw new Error(`stress-test issue ${ISSUE_ID} not found`);

const you = issue.evidence.subject.display_name.split(" ")[0];
// The typical LLM mistake we guard against: a confident uplift figure that no code computed.
const draft = `${you}, give smaller discounts today, like ${issue.evidence.peer.display_name}. This will lift your sales by 18% and add ₹40,000 this week.`;
const validation = validateCard(draft, issue.evidence);
if (validation.passed) throw new Error("the injected draft should fail the validator");

const card: ActionCard = {
  ...templateCard(issue, "salesperson"),
  id: `stress-test:${issue.id}:salesperson`,
  rejected_draft: `${INJECTED_LABEL} ${draft}`,
  validation,
  created_at: "2026-11-21T00:00:00.000Z", // older than the real cards, so it never replaces the issue's real card
};

writeFileSync("data/generated/stress-test-card.json", JSON.stringify({
  _note: "STRESS TEST. The rejected draft was injected by the team to show the validator working. Gemini did not write it. Label it 'injected test draft' wherever it is shown.",
  draft_origin: "injected test draft",
  card,
}, null, 1) + "\n");
console.log(`stress  rejected_numbers ${JSON.stringify(validation.rejected_numbers)}; wrote data/generated/stress-test-card.json`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url && key) {
  const db = createClient(url, key, { auth: { persistSession: false } });
  db.from("cards").upsert(card, { onConflict: "id" }).then(({ error }) => {
    if (error) { console.error(`FAILED  cards: ${error.message}`); process.exit(1); }
    console.log(`upsert  cards 1 (id ${card.id})`);
  });
}
