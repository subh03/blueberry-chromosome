// One-off: pre-generate the manager (audience "am") cards so no demo path waits on Gemini.
// - Targets the latest issues whose card is for the manager (cardAudience), skipping any that already have one.
// - Never touches salesperson cards or the stress-test card: it only inserts new `...:am` ids.
// - At most MAX_CALLS Gemini calls in total, counted at the fetch. One card can take up to 4 calls
//   (two drafts, each retried once on an error), so cards are GAP_MS apart: 4 calls per 20 s = 12/min max.
// - Only Gemini cards that passed the validator are saved. A template (budget used up, timeout, error,
//   two rejections) is NOT saved, so the issue stays open for a later run instead of being stuck on it.
// Run: npx tsx --conditions=react-server --env-file=.env.local supabase/scripts/pregen-manager-cards.ts
import { getServerDb } from "@/lib/db/server";
import { insertCardWithId, listCardsForIssue, listIssues } from "@/lib/db/queries";
import { toIssue } from "@/lib/db/brief";
import { aiStep, makeCard } from "@/app/api/_lib/make-card";
import { cardAudience } from "@/app/api/_lib/card";
import { aiTimeoutMs } from "@/app/api/_lib/with-timeout";

const MAX_CALLS = 6;
const GAP_MS = 20_000;
let calls = 0;

const countedFetch: typeof fetch = async (input, init) => {
  if (calls >= MAX_CALLS) throw new Error(`Gemini call budget (${MAX_CALLS}) used up`);
  calls++;
  return fetch(input, init);
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const db = getServerDb();
  const issues = (await listIssues(db)).map(toIssue).filter((i) => cardAudience(i) === "am");
  console.log(`manager issues: ${issues.length}`);
  let first = true;
  for (const issue of issues) {
    const existing = (await listCardsForIssue(db, issue.id)).filter((c) => c.audience === "am" && !c.id.startsWith("stress-test:"));
    if (existing.length) {
      console.log(`skip  ${issue.id} (has ${existing[0].id})`);
      continue;
    }
    if (calls >= MAX_CALLS) {
      console.log(`stop  call budget used up before ${issue.id}`);
      break;
    }
    if (!first) await sleep(GAP_MS); // pacing happens outside the 8 s card deadline
    first = false;
    const t0 = Date.now();
    const card = await makeCard(issue, "am", {
      aiStep,
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
      timeoutMs: aiTimeoutMs(),
      fetchImpl: countedFetch,
    });
    if (card.source !== "gemini") {
      console.log(`skip  ${issue.id}: got a ${card.source} card, not saving it (${Date.now() - t0} ms)`);
      continue;
    }
    const saved = await insertCardWithId(db, card);
    console.log(`saved ${saved.id} | ${saved.source} | ${saved.validation.word_count} words | passed=${saved.validation.passed} | ${Date.now() - t0} ms`);
  }
  console.log(`Gemini calls used: ${calls}/${MAX_CALLS}`);
}

main().catch((err) => {
  console.error("✖", err instanceof Error ? err.message : err);
  process.exit(1);
});
