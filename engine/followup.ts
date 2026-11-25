// One-week follow-up (Store Coach brief: "a week later, check whether the number moved, and say so").
// The same detectors run on both dates; each issue's own metric is read from its evidence, so before and
// after are computed the same way. The text only says whether the number moved, never why.
import type { Followup, Issue } from "../types";

/** Two values whose 1-decimal displays are equal are "flat"; the tolerance only absorbs float noise in the difference. */
export const FLAT_TOLERANCE = 0.05;

export const NEW_THIS_WEEK = (beforeAsOf: string) => `New this week: not flagged on ${beforeAsOf}, so there is nothing to compare yet.`;

interface Headline { metric: string; label: string; value: number; display: (v: number) => string; higherIsBetter: boolean }

const pct = (v: number) => `${v.toFixed(1)}%`;
const signedPct = (v: number) => `${v < 0 ? "−" : "+"}${Math.abs(v).toFixed(1)}%`;

/** Which evidence step is this issue's own metric, and which way is better. */
const HEADLINE: Record<string, { metric: string; label: string; find: RegExp | number; display?: (v: number) => string; higherIsBetter: boolean }> = {
  staff_absent_or_left: { metric: "conversion", label: "Conversion", find: /^Conversion,/, higherIsBetter: true },
  understaffed_busy_days: { metric: "weekend conversion", label: "Weekend conversion", find: /^Conversion \(Sat and Sun\)/, higherIsBetter: true },
  conversion_drop_footfall_steady: { metric: "conversion", label: "Conversion", find: /^Conversion,/, higherIsBetter: true },
  city_slowdown: { metric: "walk-ins vs the rest of the fleet", label: "Walk-ins vs the rest of the fleet", find: /walk-ins vs the rest of the fleet, last 28 days$/, display: signedPct, higherIsBetter: true },
  missing_pair: { metric: "pair rate", label: "Pair rate", find: 0, higherIsBetter: true },
  category_avoidance: { metric: "category share", label: "Category share", find: 0, higherIsBetter: true },
  discount_above_norm: { metric: "discount off MRP", label: "Discount off MRP", find: 0, higherIsBetter: false },
  low_repeat: { metric: "repeat rate", label: "Repeat rate", find: 0, higherIsBetter: true },
  role_model: { metric: "repeat rate", label: "Repeat rate", find: 0, higherIsBetter: true },
};

export function headline(i: Pick<Issue, "type" | "evidence">): Headline | null {
  const h = HEADLINE[i.type];
  if (!h) return null;
  const steps = i.evidence.steps ?? [];
  const s = typeof h.find === "number" ? steps[h.find] : steps.find((x) => (h.find as RegExp).test(x.label));
  if (!s) return null;
  return { metric: h.metric, label: h.label, value: s.value, display: h.display ?? pct, higherIsBetter: h.higherIsBetter };
}

/** Follow-up for one issue flagged on both dates, or null if its metric cannot be read. */
/** Long-window repeat rates (all-time customers) cannot move meaningfully in one week: no up/down, no improved. */
export const SLOW_METRIC_TYPES = new Set(["low_repeat", "role_model"]);

export function followupFor(before: Issue, after: Issue): Followup | null {
  const b = headline(before), a = headline(after);
  if (!b || !a || b.metric !== a.metric) return null;
  if (SLOW_METRIC_TYPES.has(after.type)) {
    return {
      metric: a.metric, before_as_of: before.as_of, before: b.value, after_as_of: after.as_of, after: a.value,
      direction: "too_early",
      display: `${a.label} ${a.display(b.value)} → ${a.display(a.value)}. Too early to tell: repeat rates move over months.`,
    };
  }
  // Direction is read from the DISPLAYED values (toFixed(1)), so "3.0% → 3.1%" can never say "did not move".
  const shown = (v: number) => Number(v.toFixed(1));
  const diff = shown(a.value) - shown(b.value);
  const direction: Followup["direction"] = Math.abs(diff) < FLAT_TOLERANCE ? "flat" : diff > 0 ? "up" : "down";
  const improved = direction !== "flat" && (direction === "up") === a.higherIsBetter;
  const nums = `${a.display(b.value)} → ${a.display(a.value)}`;
  return {
    metric: a.metric,
    before_as_of: before.as_of,
    before: b.value,
    after_as_of: after.as_of,
    after: a.value,
    direction,
    improved,
    display: direction === "flat"
      ? `${a.label} ${nums}: did not move since last week's alert.`
      : `${a.label} ${nums} (${direction}) since last week's alert.`,
  };
}

/** Same store, same type, same salesperson: the issue id without its as-of date. */
const key = (i: Pick<Issue, "id">) => i.id.split(":").slice(1).join(":");

export function attachFollowups(current: Issue[], previous: Issue[], beforeAsOf: string): Issue[] {
  const prev = new Map(previous.map((i) => [key(i), i]));
  return current.map((i) => {
    const p = prev.get(key(i));
    const f = p ? followupFor(p, i) : null;
    const { followup_note: _n, ...ev } = i.evidence;
    const { followup_note: _m, ...rest } = i;
    void _n; void _m;
    if (f) return { ...rest, followup: f, evidence: ev };
    const note = p ? `Flagged on ${beforeAsOf} too, but its metric could not be compared.` : NEW_THIS_WEEK(beforeAsOf);
    return { ...rest, followup: null, followup_note: note, evidence: { ...ev, followup_note: note } };
  });
}
