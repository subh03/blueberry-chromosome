// "Problems from the brief" scorecard: one row per problem the Store Coach brief tells us to find.
// We never claim to know Manyavar's hidden answers; the rows are the brief's own list.
import type { DataQualityFlag, Issue, ScorecardRow } from "../types";

type Problem = Pick<ScorecardRow, "lever" | "brief_problem" | "type">;

export const BRIEF_PROBLEMS: Problem[] = [
  { lever: "more_bills", brief_problem: "A good salesperson has left or keeps missing shifts", type: "staff_absent_or_left" },
  { lever: "more_bills", brief_problem: "Too few people on the floor on busy days", type: "understaffed_busy_days" },
  { lever: "more_bills", brief_problem: "Walk-ins steady but fewer of them buying", type: "conversion_drop_footfall_steady" },
  { lever: "more_bills", brief_problem: "A whole city slowing down (a market problem, not one store's)", type: "city_slowdown" },
  { lever: "bigger_baskets", brief_problem: "Salespeople not adding the obvious pair", type: "missing_pair" },
  { lever: "bigger_baskets", brief_problem: "A salesperson avoiding a category their city buys", type: "category_avoidance" },
  { lever: "bigger_baskets", brief_problem: "Discounts well above the store's norm", type: "discount_above_norm" },
  { lever: "more_repeat", brief_problem: "Stores or salespeople whose customers don't come back", type: "low_repeat" },
  { lever: "more_repeat", brief_problem: "Role models whose customers do come back", type: "role_model" },
  { lever: "not_a_problem", brief_problem: "Normal festival and season swings", type: "festival_dip" },
  { lever: "not_a_problem", brief_problem: "A number that can't be right: data issue, no alert", type: "bills_exceed_footfall" },
  { lever: "not_a_problem", brief_problem: "Brand-new store: no fair baseline yet", type: "new_store_no_baseline" },
  { lever: "not_a_problem", brief_problem: "Regional taste differences", type: "regional_taste" },
  { lever: "not_a_problem", brief_problem: "Staff with no exit date: 'left' read from the roster only", type: "staff_no_exit_date" },
];

export interface BriefScorecard {
  as_of: string;
  title: "Problems from the brief";
  note: string;
  /** Σ ₹ over store problems only (market notes and data-quality rows excluded). */
  store_rupees_at_stake: number;
  /** Σ ₹ over market notes (city slowdowns), shown apart, never added to the store total. */
  market_rupees_at_stake: number;
  /** The single store issue with the most ₹ at stake (> 0): what "open the biggest problem" opens. */
  biggest_issue_id: string | null;
  rows: ScorecardRow[];
}

/** Why a store/market row can come back not_found: the bar each detector applies (DECISIONS.md). */
export const NOT_FOUND_REASON: Record<string, string> = {
  staff_absent_or_left: "No store lost a top seller (1.3× an even share of bills) from the roster and then fell 1 point or more below both city and state peers.",
  understaffed_busy_days: "No store had 7% or more fewer people on the floor on Sat and Sun while weekend conversion fell 1 point or more below peers.",
  conversion_drop_footfall_steady: "No store had steady walk-ins and a conversion drop at least 1 point worse than both city and state peers, statistically real (z of 2 or more) and not already explained by a more specific cause.",
  city_slowdown: "No city lost 8% or more of its walk-ins against the rest of the fleet in the last 28 days with every store down and the same weeks last year flat.",
  missing_pair: "No active salesperson's pairing rate was 5 points or more below the rest of their store at p ≤ 0.001.",
  category_avoidance: "No active salesperson sold a category on half or less of their city's share (z of −4 or lower).",
  discount_above_norm: "No active salesperson discounted twice the rest of their store and 2 points or more above it.",
  low_repeat: "No active salesperson's repeat rate was far below the rest of their store (z of −4 or lower, 150+ customers).",
  role_model: "No active salesperson's customers came back at twice the rest of their store (z of 5 or more).",
  festival_dip: "No Diwali fell inside the comparison windows, so there was no festival swing to set aside.",
  bills_exceed_footfall: "No store-day had more bills than walk-ins.",
  new_store_no_baseline: "No store opened after the baseline started.",
  regional_taste: "We compare each store and each salesperson only with peers in the same city and state, so a regional taste difference is not flagged.",
  staff_no_exit_date: "No salesperson dropped off the roster 21+ days before the as-of date.",
};

const trimDot = (s: string) => s.trim().replace(/[.\s]+$/, "");

/** data_issue rows: what the guard found and set aside, from the dq_flags themselves. */
function dqReason(kind: string, flags: DataQualityFlag[]): string {
  if (kind === "staff_no_exit_date") {
    const n = flags.reduce((s, f) => s + f.rows_affected, 0);
    const stores = flags.map((f) => f.store_id).filter(Boolean).join(", ");
    return `${n} salespeople (${stores}) dropped off the roster 21+ days before the as-of date. No exit date is recorded, so "left" is read from the roster only (mentor rule). No alert.`;
  }
  const parts = flags.map((f) => (f.store_id ? `${f.store_id}: ${trimDot(f.detail)}` : trimDot(f.detail)));
  const tail = kind === "festival_dip" ? "A normal festival swing, not an alert." : "Data issue, no alert.";
  return `${parts.join("; ")}. ${tail}`;
}

const MARKET_TYPES = new Set(["city_slowdown"]);
export const isMarketNote = (type: string) => MARKET_TYPES.has(type);

/** notes: extra, computed explanations per row type (e.g. why a named lead was dropped), added to not_found reasons. */
export function buildBriefScorecard(asOf: string, issues: Issue[], flags: DataQualityFlag[], notes: Partial<Record<string, string>> = {}): BriefScorecard {
  const why = (type: string) => [NOT_FOUND_REASON[type], notes[type]].filter(Boolean).join(" ");
  const rows = BRIEF_PROBLEMS.map((p): ScorecardRow => {
    if (p.lever === "not_a_problem") {
      const mine = flags.filter((f) => f.kind === p.type);
      return {
        ...p, kind: "data_quality", status: mine.length ? "data_issue" : "not_found",
        reason: mine.length ? dqReason(p.type, mine) : why(p.type),
        store_ids: [...new Set(mine.map((f) => f.store_id).filter((s): s is string => !!s))],
        top_issue_id: null, rupees_at_stake: null,
      };
    }
    const kind = isMarketNote(p.type) ? "market_note" as const : "store" as const;
    const m = issues.filter((i) => i.type === p.type).sort((a, b) => b.rupees_at_stake - a.rupees_at_stake || a.id.localeCompare(b.id));
    if (!m.length) return { ...p, kind, status: "not_found", reason: why(p.type), store_ids: [], top_issue_id: null, rupees_at_stake: null };
    return {
      ...p, kind, status: "found",
      store_ids: [...new Set(m.map((i) => i.store_id))],
      top_issue_id: m[0].id,
      rupees_at_stake: m.reduce((s, i) => s + i.rupees_at_stake, 0),
    };
  });
  const store = issues.filter((i) => !isMarketNote(i.type));
  const sum = (xs: Issue[]) => xs.reduce((s, i) => s + i.rupees_at_stake, 0);
  const biggest = store.filter((i) => i.rupees_at_stake > 0).sort((a, b) => b.rupees_at_stake - a.rupees_at_stake || a.id.localeCompare(b.id))[0];
  return {
    as_of: asOf,
    title: "Problems from the brief",
    store_rupees_at_stake: sum(store),
    market_rupees_at_stake: sum(issues.filter((i) => isMarketNote(i.type))),
    biggest_issue_id: biggest?.id ?? null,
    note: "Each row is a problem the Store Coach brief lists. Found means our detectors flagged it in the data, with evidence. We do not know Manyavar's hidden answers. A market note (a whole city slowing down) is for the area manager and is not added to the store total.",
    rows,
  };
}
