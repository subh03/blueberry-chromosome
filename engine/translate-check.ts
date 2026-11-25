// Number check for translated cards. Owner: Naman. Pure: no I/O.
// A translation may only re-word the English card: the multiset of numbers (₹, %, plain, dates) must be
// exactly the same, and every store/staff code (LKO-02, SP1018) in the English must still be there.
// Devanagari (०-९) and Bengali (০-৯) digits are read as Latin digits first. With `lang`, the text must
// also be mostly in that script (no Romanised Hindi/Bengali).
import { extractNumbers, numberKey } from "./card-validator";

export interface TranslationCheck {
  passed: boolean;
  reasons: string[];
}

const DEV = "०१२३४५६७८९";
const BEN = "০১২৩৪৫৬৭৮৯";

/** Devanagari and Bengali digits → Latin digits. */
export function toLatinDigits(s: string): string {
  return s.replace(/[०-९]/g, (c) => String(DEV.indexOf(c))).replace(/[০-৯]/g, (c) => String(BEN.indexOf(c)));
}

function numberKeys(text: string): string[] {
  return extractNumbers(text)
    .map((t) => numberKey(t))
    .filter((k): k is string => k !== null);
}

function codes(text: string): string[] {
  return [...new Set(text.match(/\b[A-Z]{2,}-?\d+\b/g) ?? [])];
}

function counts(keys: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

const SCRIPT = { hi: { name: "Devanagari", re: /[\u0900-\u097F]/gu }, bn: { name: "Bengali", re: /[\u0980-\u09FF]/gu } } as const;

/** Pass only when the translation carries exactly the English card's numbers (no extra, none missing) and codes. */
export function checkTranslation(en: string, tr: string | null | undefined, lang?: "hi" | "bn"): TranslationCheck {
  if (!tr || !tr.trim()) return { passed: false, reasons: ["empty translation"] };
  const reasons: string[] = [];
  const latin = toLatinDigits(tr);
  const want = counts(numberKeys(en));
  const got = counts(numberKeys(latin));
  for (const [k, n] of want) {
    const g = got.get(k) ?? 0;
    if (g < n) reasons.push(`missing number ${k}${n > 1 ? ` (${g}/${n})` : ""}`);
  }
  for (const [k, n] of got) {
    const w = want.get(k) ?? 0;
    if (n > w) reasons.push(`extra number ${k}${w > 0 ? ` (${n}/${w})` : ""}`);
  }
  for (const c of codes(en)) if (!latin.includes(c)) reasons.push(`missing code ${c}`);
  if (lang) {
    // Most letters must be in the target script; Latin is only for names, codes and a few loanwords.
    const native = (tr.match(SCRIPT[lang].re) ?? []).length;
    const roman = (tr.match(/[A-Za-z]/g) ?? []).length;
    if (native < roman) reasons.push(`not in ${SCRIPT[lang].name} script (${native} vs ${roman} Latin letters)`);
  }
  return { passed: reasons.length === 0, reasons };
}
