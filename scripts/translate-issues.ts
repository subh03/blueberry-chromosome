// npm run issues:translate — translate each issue's English `cause` and `action` into Hindi and Bengali.
// Gemini only re-words: every string is checked in code (engine/translate-check.ts) and a language that
// changes, drops or adds any number or store/staff code is stored as null (the UI then shows English).
// Reads data/generated/issues.json. Writes data/generated/issue-translations.json. Never writes to the database.
// One Gemini call per issue returns all four strings; passing results are reused on rerun when the English is unchanged.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Issue } from "../types";
import { generateJson } from "../app/api/_lib/gemini";
import { checkTranslation, type TranslationCheck } from "../engine/translate-check";

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
if (!apiKey || !model) throw new Error("GEMINI_API_KEY / GEMINI_MODEL not set in .env.local");

const LANGS = ["hi", "bn"] as const;
const FIELDS = ["cause", "action"] as const;
type Lang = (typeof LANGS)[number];
type Field = (typeof FIELDS)[number];
type Key = `${Field}_${Lang}`;

interface Tr {
  en: string;
  hi: string | null;
  bn: string | null;
}
interface IssueTranslation {
  issue_id: string;
  cause: Tr;
  action: Tr;
}

const OUT = "data/generated/issue-translations.json";
const { issues } = JSON.parse(readFileSync("data/generated/issues.json", "utf8")) as { issues: Issue[] };

const WEEKDAYS = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/;
const MONTHS = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/;
const OTHER = { hi: { name: "Bengali", re: /[\u0980-\u09FF]/u }, bn: { name: "Devanagari", re: /[\u0900-\u0963\u0966-\u097F]/u } /* । ॥ are shared Bengali punctuation */ } as const;
/** checkTranslation plus: no letters of the other Indian script, and Latin only for person names (e.g. "Imran C."), mid-sentence proper nouns, codes and month names. */
function check(en: string, tr: string | null | undefined, lang: Lang): TranslationCheck {
  const base = checkTranslation(en, tr, lang);
  if (!tr) return base;
  const reasons = [...base.reasons];
  if (OTHER[lang].re.test(tr)) reasons.push(`contains ${OTHER[lang].name} letters`);
  const names = new Set([
    ...(en.match(/\b[A-Z][a-z]+(?= [A-Z]\.)/g) ?? []), // person names like "Imran C."
    ...(en.match(/(?<=[^.:;!?\s(][\s(-]+)[A-Z][a-z]+/g) ?? []), // mid-sentence proper nouns (Bengaluru, Indo-Western)
  ].filter((w) => !WEEKDAYS.test(w)));
  const stray = (tr.match(/[A-Za-z]+/g) ?? []).filter((w) => !names.has(w) && !MONTHS.test(w) && !/^[A-Z]{1,3}$/.test(w) && !new RegExp(`\\b${w}-?\\d`).test(tr));
  if (stray.length) reasons.push(`English words left untranslated: ${[...new Set(stray)].join(", ")}`);
  return { passed: reasons.length === 0, reasons };
}

const trimDot = (s: string) => s.trim().replace(/\.+$/, "");
/** The action as one line: `${who}: ${what}. ${when}.` */
function actionLine(a: Issue["action"]): string {
  return `${trimDot(a.who)}: ${trimDot(a.what)}. ${trimDot(a.when)}.`;
}

const SCHEMA = {
  type: "OBJECT",
  properties: { cause: { type: "STRING" }, action: { type: "STRING" } },
  required: ["cause", "action"],
};

const SCRIPT_NAME = { hi: "Hindi written in Devanagari script (देवनागरी)", bn: "Bengali written in Bengali script (বাংলা)" } as const;
const NOT = { hi: "Do not use any Bengali letters.", bn: "Do not use any Devanagari (Hindi) letters; Bengali script only." } as const;
const EXAMPLE = { hi: "बिल, स्टोर, कस्टमर, स्टोर मैनेजर, शनिवार, रविवार", bn: "বিল, স্টোর, কাস্টমার, স্টোর ম্যানেজার, শনিবার, রবিবার" } as const;

function prompt(en: Record<Field, string>, lang: Lang, retryReasons?: string[]): string {
  return [
    `Translate two short lines from a sales coach app for a Manyavar (Indian ethnic wear) store into ${SCRIPT_NAME[lang]}. NOT Roman/Latin letters. ${NOT[lang]}`,
    `"cause" says why the store is losing sales; "action" says who should do what, and when.`,
    `Use plain everyday spoken language, like people talk on the shop floor. Common English words (bill, store, customer, store manager, follow-up, conversion, roster, safa, mojari, sherwani, kurta) may be used, but write them in the target script (e.g. ${EXAMPLE[lang]}).`,
    `Rules:`,
    `1. Keep every number, ₹ amount, %, date, store code (like LKO-02) and staff code (like SP1018) exactly as written in the English, in Latin digits (0-9). Do not convert digits to Devanagari or Bengali digits.`,
    `2. Write any number written as an English word (two, three...) as Latin digits. Keep "lakh"/"k" amounts exactly as in the English.`,
    `3. Do not add any number, fact, name or advice. Do not drop anything. Same meaning.`,
    `4. Person names (like "Imran C."), store codes and staff codes: keep them exactly in the English (Latin) spelling. Everything else in the target script, including job titles, weekdays and English loanwords.`,
    `5. Keep the "who: what. when." shape of the action line.`,
    retryReasons?.length ? `Your last answer failed these checks, fix them: ${retryReasons.join("; ")}.` : "",
    `Return JSON {"cause": "...", "action": "..."} only.`,
    ``,
    `cause: ${en.cause}`,
    `action: ${en.action}`,
  ].filter(Boolean).join("\n");
}

async function translate(issue: Issue, prev?: IssueTranslation): Promise<IssueTranslation> {
  const en: Record<Field, string> = { cause: issue.cause, action: actionLine(issue.action) };
  const out: IssueTranslation = {
    issue_id: issue.id,
    cause: { en: en.cause, hi: null, bn: null },
    action: { en: en.action, hi: null, bn: null },
  };
  const checks = {} as Record<Key, TranslationCheck>;
  // Re-use a language that already passed for this exact English, re-checked with today's rules.
  for (const f of FIELDS) {
    for (const l of LANGS) {
      const old = prev?.[f]?.en === en[f] ? prev[f][l] : null;
      const c = check(en[f], old, l);
      checks[`${f}_${l}`] = old ? c : { passed: false, reasons: ["no translation"] };
      if (old && c.passed) out[f][l] = old;
    }
  }
  // One call per language (asking for both scripts in one call mixed Devanagari into the Bengali).
  for (const l of LANGS) {
    const missing = () => FIELDS.filter((f) => !out[f][l]);
    let reasons: string[] | undefined;
    for (let a = 1; a <= 2 && missing().length; a++) {
      await pace();
      try {
        const json = await generateJson<Partial<Record<Field, string>>>({
          apiKey: apiKey!, model: model!, prompt: prompt(en, l, reasons), schema: SCHEMA, signal: AbortSignal.timeout(timeoutMs),
        });
        for (const f of missing()) {
          const text = typeof json[f] === "string" ? json[f]!.trim() : "";
          const c = check(en[f], text, l);
          checks[`${f}_${l}`] = c;
          if (c.passed) out[f][l] = text;
        }
      } catch (e) {
        for (const f of missing()) checks[`${f}_${l}`] = { passed: false, reasons: [`attempt ${a}: ${(e as Error).message}`] };
      }
      reasons = missing().flatMap((f) => checks[`${f}_${l}`].reasons.map((r) => `${f} ${r}`));
    }
  }
  const failed = FIELDS.flatMap((f) => LANGS.filter((l) => !out[f][l]).map((l) => `${f}_${l}` as Key));
  if (failed.length) console.log(`  ${issue.id} failed: ${failed.map((k) => `${k} (${checks[k].reasons.join(", ")})`).join("; ")}`);
  return out;
}

async function main() {
  const prev = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, "utf8")) as { issues: IssueTranslation[] }).issues : [];
  const prevOf = (i: Issue) => prev.find((p) => p.issue_id === i.id);
  const out: IssueTranslation[] = new Array(issues.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < issues.length) {
        const i = next++;
        out[i] = await translate(issues[i], prevOf(issues[i]));
        const t = out[i];
        const mark = (f: Field, l: Lang) => `${f[0]}${l} ${t[f][l] ? "ok" : "X "}`;
        console.log(`${FIELDS.flatMap((f) => LANGS.map((l) => mark(f, l))).join("  ")}  ${t.issue_id}`);
      }
    }),
  );
  const file = {
    _note: "Hindi/Bengali translations of each issue's cause and action (action = `who: what. when.`). Gemini only re-words; engine/translate-check.ts rejects any language whose numbers or store/staff codes differ from the English (null = show English). Generated by npm run issues:translate.",
    model,
    generated_at: new Date().toISOString(),
    issues: out,
  };
  writeFileSync(OUT, `${JSON.stringify(file, null, 2)}\n`);
  const n = (f: Field, l: Lang) => out.filter((t) => t[f][l]).length;
  console.log(`done: ${out.length} issues; cause hi ${n("cause", "hi")}, cause bn ${n("cause", "bn")}, action hi ${n("action", "hi")}, action bn ${n("action", "bn")}`);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
