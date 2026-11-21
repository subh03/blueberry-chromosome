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

const MARKET_TYPES = new Set(["city_slowdown"]);
export const isMarketNote = (type: string) => MARKET_TYPES.has(type);

export function buildBriefScorecard(asOf: string, issues: Issue[], flags: DataQualityFlag[]): BriefScorecard {
  const rows = BRIEF_PROBLEMS.map((p): ScorecardRow => {
    if (p.lever === "not_a_problem") {
      const mine = flags.filter((f) => f.kind === p.type);
      return {
        ...p, kind: "data_quality", status: mine.length ? "data_issue" : "not_found",
        store_ids: [...new Set(mine.map((f) => f.store_id).filter((s): s is string => !!s))],
        top_issue_id: null, rupees_at_stake: null,
      };
    }
    const kind = isMarketNote(p.type) ? "market_note" as const : "store" as const;
    const m = issues.filter((i) => i.type === p.type).sort((a, b) => b.rupees_at_stake - a.rupees_at_stake || a.id.localeCompare(b.id));
    if (!m.length) return { ...p, kind, status: "not_found", store_ids: [], top_issue_id: null, rupees_at_stake: null };
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
