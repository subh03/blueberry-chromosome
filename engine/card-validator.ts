// Number validator for action cards. Owner: Naman. Pure: no I/O.
// A card is rejected when it is over 60 words, contains a number the evidence does not have,
// names someone the evidence does not name, or has no peer, no action or no time for today.
// "Every number is computed in our code": Gemini may only repeat numbers in evidence.allowedNumbers.
import type { CardValidation, Evidence, IssueAction } from "../types";
import { semanticCheck } from "./card-semantics";

export const MAX_WORDS = 60;

const DEV = "०१२३४५६७८९";
const toAscii = (s: string) => s.replace(/[०-९]/g, (c) => String(DEV.indexOf(c)));

const WORDS: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  thousand: 1_000, lakh: 100_000, crore: 10_000_000, dozen: 12,
};
// "one" is left out on purpose: "one thing", "one customer at a time" are not claims.

const D = "[0-9०-९]";
const NUM = new RegExp(
  // not glued to a letter/digit/dot, and not the tail of an UPPERCASE code like LKO-02 or BLR-05.
  // A number after a lowercase word and a hyphen (week-2, top-3) or in a range (4-8) still counts.
  `(?<![\\p{L}\\p{N}.])(?<!\\b\\p{Lu}{2,}[-–])` +
    `(?:(?:₹|Rs\\.?|INR)\\s?)?${D}+(?:,${D}+)*(?:\\.${D}+)?` +
    `(?:\\s?%|\\s?per ?cent|[kK]|\\s?(?:thousand|lakhs?|crores?|cr|L)(?![\\p{L}]))?` +
    `(?![\\p{L}\\p{N}])`,
  "gu",
);
const WORD_NUM = new RegExp(`\\b(?:${Object.keys(WORDS).join("|")})\\b`, "gi");

/** Every number-looking token, as written, in order. Store/staff codes (LKO-02, SP1018) are skipped. */
export function extractNumbers(text: string): string[] {
  const hits: { i: number; end: number; t: string }[] = [];
  for (const m of text.matchAll(NUM)) hits.push({ i: m.index!, end: m.index! + m[0].length, t: m[0].trim() });
  for (const m of text.matchAll(WORD_NUM)) {
    if (hits.some((h) => m.index! >= h.i && m.index! < h.end)) continue; // "₹40 thousand" already taken
    hits.push({ i: m.index!, end: m.index! + m[0].length, t: m[0] });
  }
  hits.sort((a, b) => a.i - b.i);
  // A range shares its unit: "6-7%" is 6% to 7%, so the first end is a percentage too.
  for (let k = 0; k + 1 < hits.length; k++) {
    const a = hits[k], b = hits[k + 1];
    if (/^[-–]$/.test(text.slice(a.end, b.i)) && /%$/.test(b.t) && /^[0-9०-९.,]+$/.test(a.t)) a.t = `${a.t}%`;
  }
  return hits.map((h) => h.t);
}

/** Canonical key: percentages are "pct:v", everything else (₹, plain, k, lakh, words) is "n:v". */
export function numberKey(token: string): string | null {
  const s = toAscii(token).toLowerCase().trim();
  if (s in WORDS) return `n:${WORDS[s]}`;
  const m = s.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(%|per ?cent|k|thousand|lakhs?|crores?|cr|l|pts|points?)?/);
  if (!m) return null;
  const v = Number(m[1].replace(/,/g, ""));
  const unit = m[2] ?? "";
  if (unit === "%" || unit.startsWith("per")) return `pct:${+v.toFixed(6)}`;
  const mult = unit === "k" || unit === "thousand" ? 1e3 : unit.startsWith("lakh") || unit === "l" ? 1e5 : unit.startsWith("crore") || unit === "cr" ? 1e7 : 1;
  return `n:${+(v * mult).toFixed(6)}`;
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

const SHOP_WORDS = new Set(
  ("monday tuesday wednesday thursday friday saturday sunday mon tue wed thu fri sat sun " +
    "january february march april may june july august september october november december jan feb mar apr jun jul aug sep sept oct nov dec " +
    "sherwani sherwanis kurta kurtas set jacket jackets mojari mojaris safa safas mala malas stole stoles indo-western indo western " +
    "manyavar mrp diwali today tomorrow store manager team hi hello namaste please thank thanks great good well ok i " +
    "your you this that every each when then and with at on in for before after by").split(" "),
);

const CONNECTIVES = new Set("also next then first finally meanwhile however now remember tip note so but and still".split(" "));

const ACTION = /\b(observe|shadow|discuss|partner|apply|practise|practice|recommend|mention|present|review|show|call|ask|check|keep|put|pair|offer|add|take|send|greet|try|follow|move|watch|stand|suggest|give|invite|note|message|text|thank|share|bring|walk|clear|agree|copy|learn|spend|use|tell|welcome|explain|demonstrate|place|hand|start|stop|hold|lead|coach|help)\b/i;
const TIME = /\b(today|tonight|now|this (?:morning|afternoon|evening|week|weekend|saturday|sunday)|by (?:closing|close|lunch|tonight|evening|(?:the )?end of (?:the )?(?:day|shift))|before (?:closing|close|lunch|you leave|(?:the )?end of)|from today)\b|आज/i;

function evidenceWords(ev: Evidence): Set<string> {
  const parts = [ev.store_id, ev.cause, ev.peer?.display_name ?? "", ev.peer?.why ?? "", ev.subject?.display_name ?? "",
    ...ev.steps.flatMap((s) => [s.label, s.compare_to?.label ?? ""])];
  const out = new Set<string>();
  for (const p of parts) for (const w of p.split(/[^\p{L}\-]+/u)) if (w) out.add(w.toLowerCase());
  return out;
}

/** Capitalised words that look like a person and are not in the evidence or the shop vocabulary. */
function strangers(text: string, ev: Evidence): string[] {
  const known = evidenceWords(ev);
  const out = new Set<string>();
  for (const m of text.matchAll(/[\p{Lu}][\p{L}’'\-]*/gu)) {
    const raw = m[0];
    const w = raw.replace(/[’']s$/u, "").replace(/[’']$/u, "");
    if (w.length < 2 || w === w.toUpperCase()) continue; // initials, codes (LKO, MRP)
    const lw = w.toLowerCase();
    const singular = lw.endsWith("s") ? lw.slice(0, -1) : lw; // Kurta Sets, Safas
    if (known.has(lw) || SHOP_WORDS.has(lw) || known.has(singular) || SHOP_WORDS.has(singular)) continue;
    const before = text.slice(0, m.index!);
    const sentenceStart = /(^|[.!?:\n]\s*|["“(]\s*)$/u.test(before);
    const vocative = text.slice(m.index! + raw.length).startsWith(",");
    if (sentenceStart && !vocative) continue; // an ordinary capitalised first word
    if (sentenceStart && (lw.endsWith("ly") || CONNECTIVES.has(lw))) continue; // "Currently, ..." is not "Ravi, ..." 
    out.add(w);
  }
  return [...out];
}

export function validateCard(text: string, ev: Evidence, action?: IssueAction | null): CardValidation {
  const reasons: string[] = [];
  const word_count = countWords(text);
  if (word_count > MAX_WORDS) reasons.push(`over ${MAX_WORDS} words`);

  const allowed = new Set<string>();
  for (const a of ev.allowedNumbers) {
    const k = numberKey(a);
    if (k && extractNumbers(a).length <= 1) allowed.add(k);
    for (const t of extractNumbers(a)) { const kk = numberKey(t); if (kk) allowed.add(kk); }
  }
  const rejected_numbers = extractNumbers(text).filter((t) => !allowed.has(numberKey(t) ?? ""));
  for (const t of rejected_numbers) reasons.push(`number not in evidence: ${t}`);

  for (const s of strangers(text, ev)) reasons.push(`names someone not in the evidence: ${s}`);

  if (ev.peer) {
    const full = ev.peer.display_name;
    const first = full.split(/\s+/)[0];
    const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!text.includes(full) && !new RegExp(`(?<![\\p{L}])${esc(first)}(?![\\p{L}])`, "u").test(text)) reasons.push("no same-store peer named");
  }
  if (!ACTION.test(text)) reasons.push("no action for today");
  if (!TIME.test(text)) reasons.push("no time (today / by …)");
  for (const r of semanticCheck(text, ev, action)) reasons.push(r);

  return { passed: reasons.length === 0, word_count, rejected_numbers, reasons };
}
