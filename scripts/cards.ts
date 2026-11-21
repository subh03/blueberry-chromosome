// npm run cards — pre-generate the salesperson cards so the demo reads them from the DB and never waits on Gemini.
// Same flow as /api/card (makeCard): Gemini under one AI_TIMEOUT_MS deadline, validator, one retry with the
// rejection reasons, else the template. Unlike makeCard it logs EVERY real draft and its validator result
// to data/generated/card-run-log.json. Nothing here fakes a rejection. Never prints keys.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { ActionCard, CardValidation, Issue } from "../types";
import { cardAiStep } from "../engine/card-ai";
import { templateCard } from "../app/api/_lib/card";
import { generateJson } from "../app/api/_lib/gemini";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL;
const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 8000;
const GAP_MS = 4500; // ≤ 13 calls a minute (free tier: 15/min)
if (!apiKey || !model) throw new Error("GEMINI_API_KEY / GEMINI_MODEL not set in .env.local");

const { issues } = JSON.parse(readFileSync("data/generated/issues.json", "utf8")) as { issues: Issue[] };
const targets = issues.filter((i) => i.evidence.subject);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;

interface Attempt { attempt: number; ms: number; draft: string | null; numbers_used: string[]; validation: CardValidation | null; error: string | null }
interface Entry { issue_id: string; type: string; store_id: string; salesperson_id: string; attempts: Attempt[]; final_source: "gemini" | "template"; outcome: string }

async function one(issue: Issue): Promise<{ entry: Entry; card: ActionCard }> {
  const attempts: Attempt[] = [];
  // The live deadline (AI_TIMEOUT_MS) covers Gemini time only, as in makeCard. Pacing waits are not counted.
  let budget = timeoutMs;
  const base = templateCard(issue, "salesperson");
  let card: ActionCard = base;
  let outcome = "template: no draft";
  for (let a = 1; a <= 2; a++) {
    const wait = lastCall + GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    const t0 = Date.now();
    const deadline = AbortSignal.timeout(Math.max(1, budget));
    try {
      const json = await generateJson<{ text?: string; numbers_used?: string[] }>({
        apiKey: apiKey!, model: model!, prompt: cardAiStep.buildPrompt(issue.evidence, "salesperson"), schema: cardAiStep.schema, signal: deadline,
      });
      budget -= Date.now() - t0;
      const draft = cardAiStep.toText(json);
      const validation = cardAiStep.validate(draft, issue.evidence);
      attempts.push({ attempt: a, ms: Date.now() - t0, draft, numbers_used: json.numbers_used ?? [], validation, error: null });
      if (validation.passed) {
        card = { ...base, id: `gemini:${issue.id}:salesperson`, text: draft, source: "gemini", validation };
        outcome = a === 1 ? "gemini: passed first draft" : "gemini: passed on retry";
        break;
      }
      card = { ...base, rejected_draft: draft, validation };
      outcome = "template: both drafts rejected";
    } catch (e) {
      attempts.push({ attempt: a, ms: Date.now() - t0, draft: null, numbers_used: [], validation: null, error: e instanceof Error ? e.message : String(e) });
      outcome = deadline.aborted ? "template: deadline passed" : "template: Gemini error";
      break;
    }
  }
  return {
    entry: { issue_id: issue.id, type: issue.type, store_id: issue.store_id, salesperson_id: issue.evidence.subject!.salesperson_id, attempts, final_source: card.source, outcome },
    card,
  };
}

async function main() {
  console.log(`cards   ${targets.length} salesperson card inputs, model ${model}, deadline ${timeoutMs} ms, ≥${GAP_MS} ms between calls`);
  const entries: Entry[] = [];
  const cards: ActionCard[] = [];
  for (const issue of targets) {
    const { entry, card } = await one(issue);
    entries.push(entry);
    cards.push(card);
    // IDs, outcome and validator reasons only (drafts with names go to the log file, not the console)
    const reasons = entry.attempts.flatMap((a) => a.validation?.reasons ?? (a.error ? [`error: ${a.error}`] : []));
    console.log(`  ${entry.issue_id.padEnd(48)} ${entry.outcome}${reasons.length ? `  [${reasons.join("; ")}]` : ""}`);
  }
  const calls = entries.reduce((n, e) => n + e.attempts.length, 0);
  const drafts = entries.flatMap((e) => e.attempts.filter((a) => a.validation));
  const summary = {
    inputs: entries.length,
    gemini_calls: calls,
    drafts: drafts.length,
    drafts_passed: drafts.filter((a) => a.validation!.passed).length,
    drafts_rejected: drafts.filter((a) => !a.validation!.passed).length,
    cards_gemini_first_try: entries.filter((e) => e.outcome === "gemini: passed first draft").length,
    cards_gemini_after_retry: entries.filter((e) => e.outcome === "gemini: passed on retry").length,
    cards_template_after_two_rejections: entries.filter((e) => e.outcome === "template: both drafts rejected").length,
    cards_template_error_or_timeout: entries.filter((e) => e.outcome.startsWith("template: d") || e.outcome.startsWith("template: G")).length,
    rejection_reasons: Object.fromEntries(
      [...drafts.flatMap((a) => a.validation!.reasons.map((r) => r.replace(/:.*/, "")))].reduce((m, r) => m.set(r, (m.get(r) ?? 0) + 1), new Map<string, number>()),
    ),
  };
  writeFileSync("data/generated/card-run-log.json", JSON.stringify({
    _note: "Every real Gemini draft for the salesperson cards and the validator's verdict. Nothing injected.",
    model, ran_at: new Date().toISOString(), deadline_ms: timeoutMs, summary, entries,
  }, null, 1) + "\n");
  console.log(`summary ${JSON.stringify(summary)}`);
  console.log("wrote   data/generated/card-run-log.json");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.log("skipped Supabase (no keys)"); return; }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from("cards").upsert(cards, { onConflict: "id" });
  if (error) throw new Error(`cards: ${error.message}`);
  console.log(`upsert  cards ${cards.length}`);
}

main().catch((e) => { console.error(`FAILED  ${e instanceof Error ? e.message : e}`); process.exit(1); });
