// npm run cards:regen -- --only=<card id>,<card id>
// Regenerates stored cards that fail the semantic audit, with the facts prompt (engine/card-prompt.ts, action passed).
// Per card: one Gemini draft; if the full validator rejects it, one retry carrying the rejection reasons;
// if that fails too, the engine template (validated) is stored and the last draft kept as rejected_draft.
// Same card id, newer created_at, validation.draft_origin "gemini". Paced ≥ 4.6 s (≤ 13 calls/min),
// --dry: Gemini runs and the log is written, the DB is not touched. --apply: upsert the logged rows, no Gemini calls.
// hard cap MAX_CALLS Gemini calls per run. Logs every draft to data/generated/<log>.json. Never prints keys.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { ActionCard, CardValidation, Issue } from "../types";
import { buildCardPrompt, CARD_SCHEMA } from "../engine/card-prompt";
import { validateCard } from "../engine/card-validator";
import { renderTemplate } from "../engine/card-templates";
import { toCardRow } from "../engine/card-origin";
import { generateJson } from "../app/api/_lib/gemini";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);
const apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL;
const timeoutMs = Math.min(Number(process.env.AI_TIMEOUT_MS) || 8000, 8000);
const GAP_MS = 4600;
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const MAX_CALLS = Number(arg("max") ?? 30);
const only = arg("only")?.split(",").filter(Boolean) ?? [];
const logName = arg("log") ?? "card-run-log.run4-semantic";
const dry = process.argv.includes("--dry");
if (!apiKey || !model) throw new Error("GEMINI_API_KEY / GEMINI_MODEL not set in .env.local");
if (!only.length) throw new Error("pass --only=<card id>,...");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let calls = 0, lastCall = 0;

interface Attempt { attempt: number; ms: number; draft: string | null; validation: CardValidation | null; error: string | null }

async function applyLog() {
  const log = JSON.parse(readFileSync(`data/generated/${logName}.json`, "utf8")) as { rows: ActionCard[] };
  const { issues } = JSON.parse(readFileSync("data/generated/issues.json", "utf8")) as { issues: Issue[] };
  const rows = log.rows.filter((r) => only.includes(r.id)).map((r) => ({ ...r, created_at: new Date().toISOString() }));
  for (const r of rows) {
    const i = issues.find((x) => x.id === r.issue_id)!;
    const v = validateCard(r.text, i.evidence, i.action);
    if (!v.passed) throw new Error(`${r.id} no longer passes: ${v.reasons.join("; ")}`);
  }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { error } = await db.from("cards").upsert(rows.map(toCardRow), { onConflict: "id" });
  if (error) throw new Error(`cards: ${error.message}`);
  console.log(`upsert  cards ${rows.length} from data/generated/${logName}.json (same ids, newer created_at)`);
}

async function main() {
  if (process.argv.includes("--apply")) return applyLog();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("cards").select("*").in("id", only);
  if (error) throw new Error(error.message);
  const stored = data as ActionCard[];
  const { issues } = JSON.parse(readFileSync("data/generated/issues.json", "utf8")) as { issues: Issue[] };
  const byId = new Map(issues.map((i) => [i.id, i]));
  const entries: unknown[] = [];
  const rows: ActionCard[] = [];

  for (const id of only) {
    const card = stored.find((c) => c.id === id);
    if (!card) { console.log(`skip    ${id}: not stored`); continue; }
    if (card.validation?.draft_origin === "injected_test") { console.log(`skip    ${id}: stress card`); continue; }
    const issue = byId.get(card.issue_id)!;
    const audience = card.audience as "am" | "salesperson";
    const attempts: Attempt[] = [];
    let feedback: { draft: string; reasons: string[] } | null = null;
    let final: ActionCard | null = null;

    for (let a = 1; a <= 2 && calls < MAX_CALLS; a++) {
      const wait = lastCall + GAP_MS - Date.now();
      if (wait > 0) await sleep(wait);
      lastCall = Date.now();
      calls++;
      const t0 = Date.now();
      try {
        const json: { text?: string } = await generateJson<{ text?: string }>({
          apiKey: apiKey!, model: model!, schema: CARD_SCHEMA, signal: AbortSignal.timeout(timeoutMs),
          prompt: buildCardPrompt(issue.evidence, { audience, action: issue.action, feedback }),
        });
        const draft: string = typeof json.text === "string" ? json.text.trim() : "";
        const v = validateCard(draft, issue.evidence, issue.action);
        attempts.push({ attempt: a, ms: Date.now() - t0, draft, validation: v, error: null });
        if (v.passed) {
          final = { ...card, text: draft, source: "gemini", rejected_draft: undefined, validation: { ...v, draft_origin: "gemini" } };
          break;
        }
        feedback = { draft, reasons: v.reasons };
      } catch (e) {
        attempts.push({ attempt: a, ms: Date.now() - t0, draft: null, validation: null, error: e instanceof Error ? e.message : String(e) });
      }
    }
    if (!final) {
      const text = renderTemplate(issue);
      const tv = validateCard(text, issue.evidence, issue.action);
      if (!tv.passed) throw new Error(`template for ${id} fails too: ${tv.reasons.join("; ")}`);
      const last = [...attempts].reverse().find((x) => x.validation);
      final = {
        ...card, text, source: "template",
        rejected_draft: last?.draft ?? undefined,
        validation: last?.validation ? { ...last.validation, draft_origin: "gemini" } : { ...tv, draft_origin: "gemini" },
      };
    }
    final = { ...final, created_at: new Date().toISOString() };
    rows.push(final);
    const outcome = final.source === "gemini" ? (attempts.length === 1 ? "gemini: passed first draft" : "gemini: passed on retry") : "template: drafts rejected or failed";
    entries.push({ card_id: id, issue_id: issue.id, audience, attempts, final_source: final.source, outcome, final_text: final.text });
    const reasons = attempts.flatMap((x) => x.validation?.reasons ?? (x.error ? [`error: ${x.error}`] : []));
    console.log(`${outcome.padEnd(36)} ${id}${reasons.length ? `  [${reasons.join("; ")}]` : ""}`);
  }

  writeFileSync(`data/generated/${logName}.json`, JSON.stringify({
    _note: "Regeneration of stored cards that failed the semantic audit. Every real Gemini draft and the full validator verdict. Nothing injected.",
    model, ran_at: new Date().toISOString(), deadline_ms: timeoutMs, gemini_calls: calls, max_calls: MAX_CALLS, entries, rows,
  }, null, 1) + "\n");
  console.log(`calls   ${calls}/${MAX_CALLS}; wrote data/generated/${logName}.json`);
  if (dry) { console.log("dry run: Supabase not updated"); return; }
  const { error: upErr } = await db.from("cards").upsert(rows.map(toCardRow), { onConflict: "id" });
  if (upErr) throw new Error(`cards: ${upErr.message}`);
  console.log(`upsert  cards ${rows.length} (same ids, newer created_at)`);
}

main().catch((e) => { console.error(`FAILED  ${e instanceof Error ? e.message : e}`); process.exit(1); });
