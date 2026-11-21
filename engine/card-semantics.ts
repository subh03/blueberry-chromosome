// Semantic checks for action cards. Owner: Naman. Pure: no I/O.
// The number validator only asks "is this number in the evidence?". These checks ask "does the sentence
// say what the evidence says?": the headcount matches the action, store counts match, a role model teaches
// (never shadows), no garbled repeats, every date is in the evidence, and the text is whole sentences.
import type { Evidence, IssueAction } from "../types";

export interface CardFacts {
  /** role_model: the subject is the one others learn from. underperformer: the subject learns from the peer. */
  subject_role: "role_model" | "underperformer" | null;
  /** Who teaches (the role model or the peer), who learns. Full display names. */
  teacher: string | null;
  learner: string | null;
  /** People to keep on the floor, from the action ("Keep 7 people") or the evidence's floor target. */
  people_on_floor: number | null;
  /** Stores in the city comparison, counted by the engine (KNP: 3 in total, this store included). */
  stores_in_city: number | null;
  city: string | null;
  /** The engine's action, word for word. */
  action: string | null;
  action_who: string | null;
  action_when: string | null;
  /** Every date ("14 Sep") the evidence shows. A card may use only these. */
  dates: string[];
  /** The engine's cause with "A → B" written out as "from A to B", so the direction survives. */
  why: string;
}

const MONTHS = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec";
const DATE = new RegExp(`\\b(\\d{1,2})\\s+(${MONTHS})[a-z]*\\b|\\b(${MONTHS})[a-z]*\\s+(\\d{1,2})\\b(?![,.]?\\d)`, "g");
const normDate = (m: RegExpMatchArray) => (m[1] ? `${+m[1]} ${m[2]}` : `${+m[4]} ${m[3]}`);

function datesIn(s: string): string[] {
  return [...s.matchAll(DATE)].map(normDate);
}

export function cardFacts(ev: Evidence, action?: IssueAction | null): CardFacts {
  const role = ev.type === "role_model" ? "role_model" : ev.subject ? "underperformer" : null;
  const subject = ev.subject?.display_name ?? null;
  const peer = ev.peer?.display_name ?? null;

  const cityStep = ev.steps.find((s) => / stores compared$/.test(s.label));
  const target = ev.steps.find((s) => /^Weekend floor target/.test(s.label));
  const fromAction = action?.what.match(/\bkeep (\d+) people\b/i);

  const dates: string[] = [];
  for (const s of ev.steps) for (const d of [...datesIn(s.label), ...datesIn(s.display)]) if (!dates.includes(d)) dates.push(d);

  return {
    subject_role: role,
    teacher: role === "role_model" ? subject : peer,
    learner: role === "role_model" ? peer : role ? subject : null,
    people_on_floor: fromAction ? Number(fromAction[1]) : target ? Math.round(target.value) : null,
    stores_in_city: cityStep ? cityStep.value : null,
    city: cityStep ? cityStep.label.replace(/ stores compared$/, "") : null,
    action: action?.what ?? null,
    action_who: action?.who ?? null,
    action_when: action?.when ?? null,
    dates,
    why: ev.cause.replace(/(\(?)([^\s(]+) → (\S+?)([);,.]?)(?=\s|$)/g, "$1from $2 to $3$4"),
  };
}

const INITIAL = /\b(\p{Lu})\.(?=\s|$)/gu; // "Sumit A." must not end a sentence
const SENTINEL = "\u0001";

/** Sentences, with name initials ("Sumit A.") kept inside them. */
export function sentences(text: string): string[] {
  const guarded = text.replace(INITIAL, `$1${SENTINEL}`);
  return guarded.split(/(?<=[.!?])\s+/).map((s) => s.replaceAll(SENTINEL, ".").trim()).filter(Boolean);
}

const WORD_NUMS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const toNum = (s: string) => (s.toLowerCase() in WORD_NUMS ? WORD_NUMS[s.toLowerCase()] : Number(s));

const DANGLING = new Set("the a an and or but to of with for at on in by from since than as your our their this that".split(" "));
const INSTRUCT = /\b(keep|have|put|schedule|maintain)\b/i;
const LEARN = /\b(shadow(?:s|ing)?|observ(?:e|es|ing)|watch(?:es|ing)?|learn(?:s|ing)? from|cop(?:y|ying))\b\s+(?:how\s+)?/gi;
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function peopleNames(ev: Evidence): string[] {
  const out = new Set<string>();
  if (ev.peer) out.add(ev.peer.display_name);
  if (ev.subject) out.add(ev.subject.display_name);
  for (const s of ev.steps) for (const m of s.label.matchAll(/\b\p{Lu}\p{Ll}+ \p{Lu}\./gu)) out.add(m[0]);
  return [...out];
}

/** Reasons the text says something the evidence does not. Empty = passes. */
export function semanticCheck(text: string, ev: Evidence, action?: IssueAction | null): string[] {
  const f = cardFacts(ev, action);
  const reasons: string[] = [];
  const add = (r: string) => { if (!reasons.includes(r)) reasons.push(r); };
  const sents = sentences(text);

  // 1. Headcount in an instruction must equal the action's headcount.
  if (f.people_on_floor !== null) {
    for (const s of sents) {
      const v = s.match(INSTRUCT);
      if (!v || !/\b(floor|people|staff|headcount|sellers)\b/i.test(s)) continue;
      const after = s.slice(v.index! + v[0].length);
      for (const m of after.matchAll(/(?<![\d.,₹])(\d+(?:\.\d+)?)(?![\d.]*\s*(?:%|pts|walk-ins|customers|bills|Sep|Oct|Nov|Aug|Jul|days))/g)) {
        if (Number(m[1]) !== f.people_on_floor) add(`headcount ${m[1]} does not match the action (keep ${f.people_on_floor} people)`);
      }
    }
  }

  // 2. Counts of stores and people.
  for (const m of text.matchAll(/\b(all|the other|other)?\s*(\d+|two|three|four|five|six|seven|eight|nine|ten)\s+(?:\p{Lu}\p{L}+\s+)?stores\b/giu)) {
    if (f.stores_in_city === null) continue;
    const n = toNum(m[2]) + (/other/i.test(m[1] ?? "") ? 1 : 0);
    if (n !== f.stores_in_city) add(`says ${n} stores; the evidence counts ${f.stores_in_city} ${f.city ?? ""} stores in total`.replace(/\s+in total/, " in total").replace(/  +/g, " "));
  }
  for (const s of sents) {
    if (/\baverage\b/i.test(s)) continue;
    for (const m of s.matchAll(/(?<![\d.])(\d+\.\d+)\s+(?:\p{L}+\s+)?(people|customers|walk-ins|sellers|staff|salespeople|bills|stores)\b/giu)) {
      add(`a count of ${m[2]} is not a whole number: ${m[1]}`);
    }
  }

  // 3. A role model teaches; they never shadow, observe or learn from someone.
  if (f.subject_role === "role_model" && f.teacher) {
    const first = f.teacher.split(/\s+/)[0];
    const addressedToThem = new RegExp(`^${esc(first)}\\b`, "u").test(text.trim());
    for (const m of text.matchAll(LEARN)) {
      const next = text.slice(m.index! + m[0].length);
      const ok = new RegExp(`^(?:${esc(f.teacher)}|${esc(first)})\\b`, "u").test(next) || (addressedToThem && /^(?:you|your)\b/i.test(next));
      if (!ok) add(`role model ${f.teacher} is told to watch or learn from someone ("${m[1].toLowerCase()}"); the role model should teach the others`);
    }
  }

  // 4. Repeated tokens and names.
  for (const m of text.matchAll(/\b(\p{L}+)\s+\1\b/giu)) add(`repeated word: "${m[0]}"`);
  for (const m of text.matchAll(/\b(since|from|until)\s+\S+\s+\1\b/gi)) add(`repeated word: "${m[0]}"`);
  for (const s of sents) {
    if ((s.match(/\bsince\b/gi)?.length ?? 0) > 1) add(`"since" twice in one sentence`);
    for (const name of peopleNames(ev)) {
      const n = s.match(new RegExp(esc(name), "gu"))?.length ?? 0;
      if (n > 1) add(`${name} named twice in one sentence`);
    }
  }

  // 5. Dates: only the evidence's, and "since" needs a whole date.
  for (const m of text.matchAll(DATE)) {
    const d = normDate(m);
    if (!f.dates.includes(d)) add(`date not in evidence: ${d}`);
  }
  for (const m of text.matchAll(new RegExp(`\\bsince\\s+(\\d{1,2})\\b(?!\\s+(?:${MONTHS}))`, "g"))) add(`incomplete date after "since": "${m[0]}"`);
  for (const m of text.matchAll(/\broster since\s+(?!\d)(\S+(?:\s+\S+)?)/g)) add(`"on the roster since" is followed by "${m[1]}", not a date`);

  // 6. Whole sentences.
  const trimmed = text.trim();
  if (trimmed && !/[.!?]["”')]?$/.test(trimmed)) add("incomplete: the card does not end with a full stop");
  for (const s of sents) {
    const last = s.replace(/[.!?"”')]+$/, "").split(/\s+/).pop()?.toLowerCase() ?? "";
    if (DANGLING.has(last)) add(`incomplete sentence ending on "${last}"`);
  }
  return reasons;
}
