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

export interface RosterRow {
  salesperson_id: string;
  date: string;
  status: string; // "Present" | "Off"
}

/**
 * No exit date is recorded. Manyavar mentors (21 Nov): no sale for 3 weeks is NORMAL,
 * so bills are never used here. Roster only:
 * - left:   roster rows (Present or Off) stop `minGapDays`+ before `asOf`.
 * - absent: still on the roster, but no Present day for `minGapDays`+ (on leave / missing shifts).
 * - notOnRoster: no roster rows at all (roster covers May-Oct 2026 only; left earlier).
 */
export function rosterLeavers(input: {
  asOf: string;
  minGapDays: number;
  salespeople: string[];
  roster: RosterRow[];
}): {
  left: { salesperson_id: string; last_on_roster: string; last_present: string | null }[];
  absent: { salesperson_id: string; last_present: string | null }[];
  notOnRoster: string[];
} {
  const lastRow = new Map<string, string>();
  const lastPresent = new Map<string, string>();
  for (const r of input.roster) {
    if ((lastRow.get(r.salesperson_id) ?? "") < r.date) lastRow.set(r.salesperson_id, r.date);
    if (r.status === "Present" && (lastPresent.get(r.salesperson_id) ?? "") < r.date) lastPresent.set(r.salesperson_id, r.date);
  }
  const left: { salesperson_id: string; last_on_roster: string; last_present: string | null }[] = [];
  const absent: { salesperson_id: string; last_present: string | null }[] = [];
  const notOnRoster: string[] = [];
  for (const id of input.salespeople) {
    const row = lastRow.get(id);
    const present = lastPresent.get(id) ?? null;
    if (!row) notOnRoster.push(id);
    else if (dayDiff(row, input.asOf) >= input.minGapDays) left.push({ salesperson_id: id, last_on_roster: row, last_present: present });
    else if (!present || dayDiff(present, input.asOf) >= input.minGapDays) absent.push({ salesperson_id: id, last_present: present });
  }
  return { left, absent, notOnRoster };
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
