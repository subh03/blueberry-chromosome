// Handshake contract for Store Coach. Owner: Naman. Ask before changing.
// Every number here is computed by our code (engine/), never by an LLM.
// "Today" in the data = 2026-10-31 (close).

export type ISODate = string; // "2026-10-31"
export type StoreId = string; // "LKO-02" (always text, never a number)
export type SalespersonId = string; // "SP1030"
export type AreaManagerId = string; // "AM-01"

export type Lever = "more_bills" | "bigger_baskets" | "more_repeat";

export type IssueType =
  // P1
  | "staff_absent_or_left"
  | "understaffed_busy_days"
  | "conversion_drop_footfall_steady"
  | "city_slowdown"
  | "missing_pair"
  | "discount_above_norm"
  // P2
  | "category_avoidance"
  | "low_repeat"
  | "role_model";

export type WindowName = "current_28d" | "baseline_mayjul" | "all_time";

/** One store over one window. Rates are plain numbers: conversion 12.95 means 12.95%. */
export interface StoreMetrics {
  store_id: StoreId;
  as_of: ISODate;
  window: WindowName;
  footfall: number;
  bills: number;
  conversion: number; // bills / footfall * 100
  ipb: number; // non-packaging qty / bills
  discount_pct: number; // sum((mrp-sp)*qty) / sum(mrp*qty) * 100, non-packaging
  repeat_rate: number | null; // %; null when too few customers
  avg_bill_value: number; // ₹ incl. GST
  presence: number | null; // % Present of roster rows; null outside May-Oct 2026
}

export interface SalespersonMetrics {
  salesperson_id: SalespersonId;
  store_id: StoreId;
  as_of: ISODate;
  display_name: string; // first name + initial, as in data
  bills: number;
  ipb: number;
  discount_pct: number;
  repeat_rate: number | null;
  presence: number | null;
  pair_attach_sherwani: number | null; // % of sherwani bills with safa/mojari/mala
  pair_attach_kurta: number | null; // % of kurta bills with a jacket
  last_active: ISODate | null; // last Present roster day or last bill
  inferred_left: boolean; // roster rows stopped 21+ days before as-of (bills never used: no sale for 3 weeks is normal)
}

/** One link in the evidence chain shown in the UI. */
export interface EvidenceStep {
  label: string; // "Conversion, last 28 days"
  value: number;
  display: string; // "11.0%" — exactly what the UI and the card may show
  formula: string; // "bills ÷ footfall × 100"
  rows: number; // rows behind this number
  compare_to?: { label: string; value: number; display: string };
}

/** The only input Gemini sees. */
export interface Evidence {
  store_id: StoreId;
  as_of: ISODate;
  lever: Lever;
  type: IssueType;
  steps: EvidenceStep[];
  cause: string; // written by code from the detector, e.g. "Top seller not on roster since 2026-09-14"
  peer: { salesperson_id: SalespersonId; display_name: string; why: string } | null;
  /** Added 21 Nov (optional): the salesperson a salesperson-level issue is about. The card goes to them. */
  subject?: { salesperson_id: SalespersonId; display_name: string } | null;
  /** Added 21 Nov (optional): mirror of Issue.followup_note, stored with the evidence jsonb. */
  followup_note?: string;
  /** Added 21 Nov (optional): mirror of Issue.action, so every card path (prompt + validator) sees the action word for word. */
  action?: IssueAction;
  /** Every number-looking token the card is allowed to contain, as displayed. */
  allowedNumbers: string[]; // ["11.0%", "12.6%", "6", "4-8 pm", "₹1,24,000"]
}

export interface IssueAction {
  who: string; // "Store manager, LKO-02"
  what: string; // "Keep six people on the floor"
  when: string; // "Sat and Sun, 4-8 pm"
}

export interface Issue {
  id: string; // `${as_of}:${store_id}:${type}`
  as_of: ISODate;
  store_id: StoreId;
  area_manager_id: AreaManagerId;
  lever: Lever;
  type: IssueType;
  rupees_at_stake: number; // 28-day ₹, computed in engine/rupees.ts
  rank: number; // 1 = biggest ₹ within this AM
  cause: string;
  action: IssueAction;
  evidence: Evidence;
  followup: Followup | null;
  /** Added 21 Nov (optional): why followup is null, e.g. "New this week: …". Mirrored in evidence.followup_note (the DB has no column). */
  followup_note?: string;
}

export interface Followup {
  metric: string; // "conversion"
  before_as_of: ISODate; // "2026-10-24"
  before: number;
  after_as_of: ISODate; // "2026-10-31"
  after: number;
  direction: "up" | "down" | "flat";
  display: string; // "Conversion 12.6% → 10.4% (down) since last week's alert."
  /** Added 21 Nov (optional): did the metric move the good way? For discounts, down is better. Flat = false.
   *  Says nothing about why it moved: never present it as caused by the action. */
  improved?: boolean;
}

/**
 * Result of the number validator on the Gemini draft.
 * source "gemini": the draft passed and is `text` (passed: true).
 * source "template": the draft failed (passed: false); it is `rejected_draft`, and
 * word_count / rejected_numbers / reasons describe that draft, not the template text.
 */
export interface CardValidation {
  passed: boolean;
  word_count: number;
  rejected_numbers: string[]; // tokens in Gemini text that are not in allowedNumbers
  reasons: string[]; // "over 60 words", "no peer named", ...
  /** Added 21 Nov (optional): mirror of ActionCard.draft_origin, so it survives in the cards.validation jsonb. */
  draft_origin?: DraftOrigin;
  /** Added 21 Nov (optional): the team fixed Gemini's wording by hand. gemini_text is Gemini's validated draft, kept for audit. */
  team_edit?: { gemini_text: string; why: string };
}

/** Where a card's draft came from: Gemini, or a team-written stress test. Unset on pure templates. */
export type DraftOrigin = "gemini" | "injected_test";

export interface ActionCard {
  id: string;
  issue_id: string;
  audience: "am" | "salesperson";
  salesperson_id: SalespersonId | null;
  text: string; // ≤60 words for salesperson cards
  source: "gemini" | "template";
  validation: CardValidation;
  rejected_draft?: string; // Gemini draft that failed (shown in demo beat 4)
  created_at: string; // ISO timestamp
  /** Added 21 Nov (optional). "injected_test" = the labelled stress-test card: never present it as a Gemini mistake. */
  draft_origin?: DraftOrigin;
}

export type DqKind =
  | "packaging_rows"
  | "bills_exceed_footfall"
  | "new_store_no_baseline"
  | "staff_no_exit_date"
  | "festival_dip";

export interface DataQualityFlag {
  id: string;
  store_id: StoreId | null;
  kind: DqKind;
  detail: string;
  rows_affected: number;
  alerted: false; // DQ flags are never sent to area managers
}

/** One row of the home-page "Brief checklist" scorecard. */
export interface ScorecardRow {
  lever: Lever | "not_a_problem";
  brief_problem: string; // wording from the brief
  type: IssueType | DqKind;
  status: "found" | "not_found" | "data_issue";
  store_ids: StoreId[];
  top_issue_id: string | null;
  rupees_at_stake: number | null;
  /** Added 21 Nov (optional). "market_note" (city_slowdown) is for the area manager: never add it to the
   *  store ₹ total or pick it as the biggest problem. "data_quality" rows are never alerts. */
  kind?: "store" | "market_note" | "data_quality";
  /** Added 21 Nov (optional): one plain line for not_found / data_issue rows, from the real checks. */
  reason?: string;
}

export interface AmBrief {
  area_manager_id: AreaManagerId;
  name: string;
  city: string;
  as_of: ISODate;
  max_alerts_per_week: number;
  issues: Issue[]; // length ≤ max_alerts_per_week, sorted by rupees_at_stake desc
  market_note: string | null; // city_slowdown goes here, not as a store alert
}

export interface RunLog {
  id: string;
  trigger: "cron" | "manual" | "load";
  started_at: string;
  finished_at: string | null;
  as_of: ISODate;
  rows_read: number;
  issues: number;
  cards: number;
  gemini_ok: number;
  gemini_fallback: number;
  ok: boolean;
  error: string | null;
}

// ---------------------------------------------------------------- v2 (25 Nov): role screens
// Written by `npm run team` to data/generated/team.json. Aggregates only; names are first name + initial.

export type Lang = "en" | "hi" | "bn";

/** How a number sits against its comparison. Computed in code; the UI only colours it. */
export type Standing = "above" | "below" | "same" | null;

/** One metric for one store: now (last 28 days) vs its own baseline (May-Jul) and vs peers. */
export interface StoreMetricCompare {
  now: number | null;
  baseline: number | null;
  city_peers: number | null; // pooled, same-city stores excluding this one
  state_peers: number | null; // pooled, same-state stores excluding this one
  vs_peers: Standing; // "below" only when worse than BOTH city and state peers by the metric's bar
}

export interface StoreCompare {
  store_id: StoreId;
  city: string;
  state: string;
  area_manager_id: AreaManagerId;
  is_new: boolean; // opened after the baseline: no comparison, shown as "too new to compare"
  footfall: number; // last 28 days
  bills: number; // last 28 days
  conversion: StoreMetricCompare; // %
  ipb: StoreMetricCompare; // items per bill
  presence: StoreMetricCompare; // % Present of roster rows
  /** Store-level basket check: items per bill below BOTH city and state peers and below its own baseline. */
  basket_flag: {
    gap_vs_peers: number; // items per bill, smaller of the city and state gaps (positive = store is lower)
    rupees: number; // gap × bills × average item value, 28 days, rounded to ₹100
    avg_item_value: number;
    formula: string; // "gap × bills × average item value"
    display: string; // plain line, e.g. "1.69 items per bill vs 1.85 city / 1.84 state"
  } | null;
}

/** One salesperson in their store's team table, last 28 days. */
export interface TeamRow {
  salesperson_id: SalespersonId;
  store_id: StoreId;
  display_name: string;
  days_rostered: number;
  days_present: number;
  presence: number | null; // %
  bills: number;
  /** Estimate: bills ÷ (store walk-ins on their present days ÷ salespeople present those days) × 100. Footfall is per store, not per person. */
  est_conversion: number | null;
  ipb: number | null;
  repeat_rate: number | null; // % of customers back, Aug 1 to as-of (needs 30+ days of history); null when too few customers
  vs_store: { presence: Standing; est_conversion: Standing; ipb: Standing; repeat_rate: Standing }; // vs the median of the rest of the store
  on_roster: boolean; // false = not on the roster in the window (left or away)
}

export interface TeamFile {
  _note: string;
  as_of: ISODate;
  window: { from: ISODate; to: ISODate };
  baseline: { from: ISODate; to: ISODate };
  stores: StoreCompare[];
  team: TeamRow[];
}

/** Written by `npm run cards:translate` to data/generated/card-translations.json. */
export interface CardTranslation {
  issue_id: string;
  audience: "am" | "salesperson";
  en: string; // the stored, validated English card
  hi: string | null; // null = translation failed the number check; UI shows English
  bn: string | null;
  checks: { hi: { passed: boolean; reasons: string[] }; bn: { passed: boolean; reasons: string[] } };
}
