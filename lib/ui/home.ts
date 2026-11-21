import type { Issue, ScorecardRow } from "@/types";

export const inr = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export type Severity = "high" | "medium" | "low" | "model";

/** Severity is a ranking label computed from ₹ at stake; always shown as a word. */
export function severityOf(row: ScorecardRow): Severity {
  if (row.type === "role_model") return "model";
  const rupees = row.rupees_at_stake ?? 0;
  if (rupees >= 100000) return "high";
  if (rupees >= 40000) return "medium";
  return "low";
}

export const severityLabel: Record<Severity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  model: "Role model",
};

const SALESPERSON_TYPES = [
  "missing_pair",
  "category_avoidance",
  "discount_above_norm",
  "low_repeat",
];

/** Who the action card is for: the salesperson when the issue is about one, else the manager. */
export function cardHref(issue: Issue) {
  const audience =
    issue.evidence.subject && SALESPERSON_TYPES.includes(issue.type)
      ? "salesperson"
      : "am";
  return `/cards/for-issue?issue=${encodeURIComponent(issue.id)}&audience=${audience}`;
}

export function isStoreRow(row: ScorecardRow) {
  return row.kind
    ? row.kind === "store"
    : row.type !== "city_slowdown" && row.lever !== "not_a_problem";
}

export function isMarketNote(row: ScorecardRow) {
  return row.kind === "market_note" || (!row.kind && row.type === "city_slowdown");
}

/** The ₹ is a per-28-day figure from the last 28 days of data, not a forecast; say so wherever the engine label says "next 28 days". */
const STAKE_BASIS: Record<string, string> = {
  staff_absent_or_left: "walk-ins",
  understaffed_busy_days: "walk-ins",
  city_slowdown: "walk-ins",
  low_repeat: "new customers",
  missing_pair: "bills",
  category_avoidance: "bills",
  discount_above_norm: "sales at MRP",
};
export function stakeLabel(label: string, type: string) {
  const basis = STAKE_BASIS[type] ?? "store data";
  return label.replace("next 28 days", `per 28 days, based on the last 28 days of ${basis}`);
}

/** Splits evidence steps into the plain-language groups the panel shows. */
export function groupSteps(issue: Issue) {
  const steps = issue.evidence.steps;
  const money = steps.filter(
    (step) => step.label.includes("₹ at stake") || step.label.includes("at stake"),
  );
  const rest = steps.filter((step) => !money.includes(step));
  const compared = rest.filter((step) => step.compare_to);
  const inputs = rest.filter((step) => !step.compare_to);
  return { money, compared, inputs };
}
