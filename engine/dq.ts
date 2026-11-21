// Data-quality guard. DQ findings are never sent to area managers as alerts.
import type { StoreDay } from "./metrics";
import type { StoreInfo } from "./compare";

/** Store-days where bills > walk-ins: a number that can't be right. */
export function billsExceedFootfall(days: StoreDay[]): { store_id: string; days: number }[] {
  const counts = new Map<string, number>();
  for (const d of days) if (d.bills > d.footfall) counts.set(d.store_id, (counts.get(d.store_id) ?? 0) + 1);
  return [...counts].map(([store_id, n]) => ({ store_id, days: n })).sort((a, b) => a.store_id.localeCompare(b.store_id));
}

/** Keys of store-days to leave out of conversion. */
export function badConversionDays(days: StoreDay[]): Set<string> {
  return new Set(days.filter((d) => d.bills > d.footfall).map((d) => `${d.store_id}|${d.date}`));
}

/** Stores opened after the baseline window starts have no history to compare. */
export function newStores<T extends StoreInfo>(stores: T[], baselineFrom: string): T[] {
  return stores.filter((s) => s.opened_on > baselineFrom);
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/**
 * No exit date is recorded. "Inferred left" = last activity (Present roster day or bill)
 * is `minGapDays`+ before `asOf`. `neverActive` = no activity at all in the given rows.
 */
export function inferredLeavers(input: {
  asOf: string;
  minGapDays: number;
  salespeople: string[];
  activity: { salesperson_id: string; date: string }[];
}): { left: { salesperson_id: string; last_active: string }[]; neverActive: string[] } {
  const last = new Map<string, string>();
  for (const a of input.activity) {
    const prev = last.get(a.salesperson_id);
    if (!prev || a.date > prev) last.set(a.salesperson_id, a.date);
  }
  const left: { salesperson_id: string; last_active: string }[] = [];
  const neverActive: string[] = [];
  for (const id of input.salespeople) {
    const l = last.get(id);
    if (!l) neverActive.push(id);
    else if (dayDiff(l, input.asOf) >= input.minGapDays) left.push({ salesperson_id: id, last_active: l });
  }
  return { left, neverActive };
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
