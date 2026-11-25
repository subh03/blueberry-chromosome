// npm run cards:translate — translate the current stored English action cards into Hindi and Bengali.
// Gemini only re-words: every translation is checked in code (engine/translate-check.ts) and a language
// that changes, drops or adds any number is stored as null with the reasons (the UI then shows English).
// Reads Supabase `cards` read-only (falls back to the latest card-run-log*.json). Writes
// data/generated/card-translations.json. Never prints keys. Never writes to the database.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { ActionCard, CardTranslation, Issue } from "../types";
import { generateJson } from "../app/api/_lib/gemini";
import { checkTranslation } from "../engine/translate-check";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL;
const timeoutMs = 8000;
const CONCURRENCY = 2;
const GAP_MS = 4500; // ≤ 13 calls a minute across workers (free tier: 15/min)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
async function pace() {
  const wait = lastCall + GAP_MS - Date.now();
  lastCall = Math.max(Date.now(), lastCall + GAP_MS);
  if (wait > 0) await sleep(wait);
}
const STRESS_PREFIX = "stress:";
if (!apiKey || !model) throw new Error("GEMINI_API_KEY / GEMINI_MODEL not set in .env.local");

const { issues } = JSON.parse(readFileSync("data/generated/issues.json", "utf8")) as { issues: Issue[] };
const issueIds = new Set(issues.map((i) => i.id));

type Src = Pick<ActionCard, "issue_id" | "audience" | "text">;

/** Newest real card per (issue_id, audience), same order as /api/card's pickSavedCard. */
async function fromDb(): Promise<Src[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.from("cards").select("id,issue_id,audience,text,created_at").in("issue_id", [...issueIds]);
    if (error || !data) return null;
    const rows = (data as (Src & { id: string; created_at: string })[])
      .filter((c) => !c.id.startsWith(STRESS_PREFIX))
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    const seen = new Map<string, Src>();
    for (const r of rows) {
      const k = `${r.issue_id}|${r.audience}`;
      if (!seen.has(k)) seen.set(k, { issue_id: r.issue_id, audience: r.audience, text: r.text });
    }
    return [...seen.values()];
  } catch {
    return null;
  }
}

/** Fallback: final_text of the newest run log that has each issue (salesperson cards only). */
function fromRunLogs(): Src[] {
  const dir = "data/generated";
  const logs = readdirSync(dir)
    .filter((f) => /^card-run-log.*\.json$/.test(f))
    .map((f) => `${dir}/${f}`)
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  const seen = new Map<string, Src>();
  for (const f of logs) {
    const j = JSON.parse(readFileSync(f, "utf8")) as { entries?: { issue_id: string; final_text?: string }[] };
    for (const e of j.entries ?? []) {
      if (!issueIds.has(e.issue_id) || !e.final_text || seen.has(e.issue_id)) continue;
      seen.set(e.issue_id, { issue_id: e.issue_id, audience: "salesperson", text: e.final_text });
    }
  }
  return [...seen.values()];
}

const SCHEMA = {
  type: "OBJECT",
  properties: { hi: { type: "STRING" }, bn: { type: "STRING" } },
  required: ["hi", "bn"],
};

function prompt(card: Src, retryReasons?: string[]): string {
  const reader = card.audience === "am" ? "an area manager" : "a store salesperson";
  return [
    `Translate this action card for ${reader} at a Manyavar (Indian ethnic wear) store into:`,
    `- "hi": Hindi written in Devanagari script (देवनागरी). NOT Roman/Latin letters.`,
    `- "bn": Bengali written in Bengali script (বাংলা). NOT Roman/Latin letters.`,
    `Use plain everyday spoken language, like people talk on the shop floor. Common English words such as bill, store, safa, mojari, sherwani, kurta, customer, follow-up may be used, but write them in the target script (e.g. बिल, स्टोर / বিল, স্টোর).`,
    `Rules:`,
    `1. Keep every number, ₹ amount, %, date, store code (like LKO-02) and staff code exactly as written in the English, in Latin digits (0-9). Do not convert digits to Devanagari or Bengali digits.`,
    `2. Write any number written as an English word (two, three...) as Latin digits. Keep "lakh"/"k" amounts exactly as in the English.`,
    `3. Do not add any number, fact, name or advice. Do not drop anything. Same meaning.`,
    `4. Person names, store codes and staff codes: keep them exactly in the English (Latin) spelling. Everything else in the target script.`,
    `5. At most 70 words each.`,
    retryReasons?.length ? `Your last answer failed these checks, fix them: ${retryReasons.join("; ")}.` : "",
    `Return JSON {"hi": "...", "bn": "..."} only.`,
    ``,
    `English card:`,
    card.text,
  ].filter(Boolean).join("\n");
}

async function translate(card: Src, prev?: CardTranslation): Promise<CardTranslation> {
  // Re-use a language that already passed for this exact text, re-checked with today's rules.
  const keep = prev && prev.en === card.text
    ? { ...prev, hi: prev.hi && checkTranslation(card.text, prev.hi, "hi").passed ? prev.hi : null, bn: prev.bn && checkTranslation(card.text, prev.bn, "bn").passed ? prev.bn : null }
    : undefined;
  const best: CardTranslation = {
    issue_id: card.issue_id, audience: card.audience, en: card.text, hi: keep?.hi ?? null, bn: keep?.bn ?? null,
    checks: {
      hi: keep?.hi ? keep.checks.hi : { passed: false, reasons: ["no translation"] },
      bn: keep?.bn ? keep.checks.bn : { passed: false, reasons: ["no translation"] },
    },
  };
  if (best.hi && best.bn) return best;
  let reasons: string[] | undefined;
  for (let a = 1; a <= 2; a++) {
    await pace();
    try {
      const json = await generateJson<{ hi?: string; bn?: string }>({
        apiKey: apiKey!, model: model!, prompt: prompt(card, reasons), schema: SCHEMA, signal: AbortSignal.timeout(timeoutMs),
      });
      for (const lang of ["hi", "bn"] as const) {
        if (best[lang]) continue; // keep a language that already passed
        const text = typeof json[lang] === "string" ? json[lang]!.trim() : "";
        const check = checkTranslation(card.text, text, lang);
        best.checks[lang] = check;
        best[lang] = check.passed ? text : null;
      }
    } catch (e) {
      for (const lang of ["hi", "bn"] as const) if (!best[lang]) best.checks[lang] = { passed: false, reasons: [`attempt ${a}: ${(e as Error).message}`] };
    }
    if (best.hi && best.bn) break;
    reasons = [...(best.hi ? [] : best.checks.hi.reasons.map((r) => `hi ${r}`)), ...(best.bn ? [] : best.checks.bn.reasons.map((r) => `bn ${r}`))];
  }
  return best;
}

async function main() {
  const db = await fromDb();
  const cards = (db ?? fromRunLogs()).sort((a, b) => a.issue_id.localeCompare(b.issue_id) || a.audience.localeCompare(b.audience));
  console.log(`source: ${db ? "supabase cards" : "run logs (DB unreachable)"}; ${cards.length} cards`);
  const OUT = "data/generated/card-translations.json";
  const prev = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, "utf8")) as { cards: CardTranslation[] }).cards : [];
  const prevOf = (c: Src) => prev.find((p) => p.issue_id === c.issue_id && p.audience === c.audience);
  const out: CardTranslation[] = new Array(cards.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < cards.length) {
        const i = next++;
        out[i] = await translate(cards[i], prevOf(cards[i]));
        const t = out[i];
        console.log(`${t.checks.hi.passed ? "hi ok " : "hi X  "} ${t.checks.bn.passed ? "bn ok " : "bn X  "} ${t.issue_id} (${t.audience})`);
      }
    }),
  );
  const file = {
    _note: "Hindi/Bengali translations of the stored English action cards. Gemini only re-words; engine/translate-check.ts rejects any language whose numbers differ from the English (null = show English). Generated by npm run cards:translate.",
    model,
    generated_at: new Date().toISOString(),
    source: db ? "supabase:cards" : "card-run-log",
    cards: out,
  };
  writeFileSync(OUT, `${JSON.stringify(file, null, 2)}\n`);
  const hi = out.filter((c) => c.hi).length, bn = out.filter((c) => c.bn).length;
  console.log(`done: ${out.length} cards, hi passed ${hi}, bn passed ${bn}`);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
