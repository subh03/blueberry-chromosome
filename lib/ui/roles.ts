// Role screens (v2): read the committed outputs of `npm run load`, `npm run team` and
// `npm run cards:translate` at build time. No numbers are computed here beyond picking and sorting.
import type { AmBrief, CardTranslation, Issue, Lang, StoreCompare, TeamFile, TeamRow } from "@/types";
import issuesJson from "@/data/generated/issues.json";
import briefsJson from "@/data/generated/am-briefs.json";
import teamJson from "@/data/generated/team.json";
import translationsJson from "@/data/generated/card-translations.json";

export const ISSUES = (issuesJson as unknown as { issues: Issue[] }).issues;
export const BRIEFS = (briefsJson as unknown as { briefs: AmBrief[] }).briefs;
export const TEAM = teamJson as unknown as TeamFile;
const TRANSLATIONS = (translationsJson as unknown as { cards: CardTranslation[] }).cards;

export const MANAGERS = BRIEFS.map((b) => ({ id: b.area_manager_id, name: b.name, city: b.city }));

export const storesOf = (amId: string): StoreCompare[] =>
  TEAM.stores.filter((s) => s.area_manager_id === amId).sort((a, b) => a.store_id.localeCompare(b.store_id));

export const storeById = (id: string) => TEAM.stores.find((s) => s.store_id === id) ?? null;

export const teamOf = (storeId: string): TeamRow[] =>
  TEAM.team
    .filter((r) => r.store_id === storeId)
    .sort((a, b) => Number(b.on_roster) - Number(a.on_roster) || b.bills - a.bills);

export const personById = (id: string) => TEAM.team.find((r) => r.salesperson_id === id) ?? null;

/** Store problems, biggest ₹ first. The city slowdown is a market note, never a store action. */
export const storeIssues = (storeId: string) =>
  ISSUES.filter((i) => i.store_id === storeId && i.type !== "city_slowdown" && i.type !== "role_model").sort(
    (a, b) => b.rupees_at_stake - a.rupees_at_stake,
  );

export const roleModelIn = (storeId: string) =>
  ISSUES.find((i) => i.store_id === storeId && i.type === "role_model") ?? null;

export const personIssues = (spId: string) =>
  ISSUES.filter((i) => i.evidence.subject?.salesperson_id === spId && i.type !== "role_model").sort(
    (a, b) => b.rupees_at_stake - a.rupees_at_stake,
  );

export const SALESPERSON_TYPES = ["missing_pair", "category_avoidance", "discount_above_norm", "low_repeat"];
export const audienceOf = (issue: Issue): "am" | "salesperson" =>
  issue.evidence.subject && SALESPERSON_TYPES.includes(issue.type) ? "salesperson" : "am";

/** The stored card text in the chosen language, or English when the translation failed its number check. */
export function cardText(issue: Issue, lang: Lang): { text: string; lang: Lang; fellBack: boolean } | null {
  const t = TRANSLATIONS.find((c) => c.issue_id === issue.id && c.audience === audienceOf(issue));
  if (!t) return null;
  if (lang === "en") return { text: t.en, lang: "en", fellBack: false };
  const tr = t[lang];
  return tr ? { text: tr, lang, fellBack: false } : { text: t.en, lang: "en", fellBack: true };
}

/** Median of the non-null values, used only to label "store middle" next to a person's number. */
export function median(values: (number | null)[]) {
  const v = values.filter((x): x is number => x !== null).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : Math.round(((v[m - 1] + v[m]) / 2) * 100) / 100;
}

// ---------------------------------------------------------------- problem screen (v2.1)
import issueTrJson from "@/data/generated/issue-translations.json";
type IssueTr = { issue_id: string; cause: { en: string; hi: string | null; bn: string | null }; action: { en: string; hi: string | null; bn: string | null } };
const ISSUE_TR = ((issueTrJson as unknown as { issues?: IssueTr[] }).issues ?? []);

export const issueById = (id: string) => ISSUES.find((i) => i.id === id) ?? null;

const actionLine = (i: Issue) => `${i.action.who}: ${i.action.what.replace(/\.$/, "")}. ${i.action.when.replace(/\.$/, "")}.`;

/** Cause and action in the chosen language; English when the translation is missing or failed its number check. */
export function issueWords(issue: Issue, lang: Lang) {
  const t = ISSUE_TR.find((x) => x.issue_id === issue.id);
  // Cause must match the current English exactly (stale translations are ignored); the action line may differ only in punctuation.
  const pick = (f: { en: string; hi: string | null; bn: string | null } | undefined, en: string, strict = true) => {
    if (lang === "en" || !f || (strict && f.en !== en)) return { text: en, lang: "en" as Lang };
    const v = f[lang];
    return v ? { text: v, lang } : { text: en, lang: "en" as Lang };
  };
  return { cause: pick(t?.cause, issue.cause), action: pick(t?.action, actionLine(issue), false) };
}

/** Severity word from ₹ at stake, same bars as the overview (High ≥ ₹1,00,000, Medium ≥ ₹40,000). */
export const severityOfIssue = (i: Issue): "high" | "medium" | "low" | "model" =>
  i.type === "role_model" ? "model" : i.rupees_at_stake >= 100000 ? "high" : i.rupees_at_stake >= 40000 ? "medium" : "low";

export const problemHref = (issue: Issue, lang: Lang, from?: string) => {
  const q = new URLSearchParams();
  if (lang !== "en") q.set("lang", lang);
  if (from) q.set("from", from);
  const qs = q.toString();
  return `/problem/${encodeURIComponent(issue.id)}${qs ? `?${qs}` : ""}`;
};
