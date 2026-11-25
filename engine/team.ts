// Role screens (v2): store vs peers and the per-salesperson team table. Pure: no I/O, nothing printed.
// Data-quality guard mirrors detectors.ts: conversion uses clean store-days only (bills > walk-ins dropped,
// Diwali ±3 days in the store's state dropped); stores opened after the baseline starts are never judged
// and never used as peers. Items per bill and ₹ use every day (non-packaging items).
import type { Standing, StoreCompare, StoreMetricCompare, TeamRow } from "../types";
import {
  buildStoreDays, conversion, inRange, itemsPerBill, presencePct, sumDays,
  type BillLineRow, type BillRow, type FootfallRow, type ItemRow, type RosterRow, type StoreDay,
} from "./metrics";
import { addDays } from "./dq";
import { MIN_REPEAT_CUSTOMERS, repeatRate, windows } from "./rows";

export const TEAM_T = {
  festivalDays: 3,
  bar: { conversion: 1.0, ipb: 0.1, presence: 5 }, // store vs peers
  basketBaselineGap: 0.05, // store ipb must also be this far below its own baseline
  spBar: { presence: 5, est_conversion: 1.5, ipb: 0.15, repeat_rate: 3 }, // salesperson vs store median
  minPresentDays: 5, // est_conversion needs this many Present days
  minBills: 10, // ipb needs this many bills
  rosterFrom: "2026-05-01",
} as const;

export interface TeamInput {
  asOf: string;
  stores: { store_id: string; city: string; state: string; opened_on: string; area_manager_id: string }[];
  bills: BillRow[];
  lines: BillLineRow[];
  items: ItemRow[];
  footfall: FootfallRow[];
  roster: RosterRow[];
  salespeople: { salesperson_id: string; store_id: string; name: string }[];
  calendar: { date: string; state: string; festival: string }[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const fin = (n: number): number | null => (Number.isFinite(n) ? r2(n) : null);
/** ₹ rounded to the nearest 100, never negative (same rule as engine/rupees.ts). */
export const round100 = (n: number) => Math.max(0, Math.round(n / 100) * 100);

/** "above" / "below" / "same" vs one reference, higher is better. Gap is taken from the 2-decimal values. */
export function standingVs(value: number | null, ref: number | null, bar: number): Standing {
  if (value === null || ref === null) return null;
  const d = r2(value - ref);
  if (d >= bar) return "above";
  if (d <= -bar) return "below";
  return "same";
}

/** vs BOTH peers: "below" only when worse than both by the bar, "above" only when better than both. */
export function standingVsPeers(value: number | null, city: number | null, state: number | null, bar: number): Standing {
  const refs = [city, state].filter((x): x is number => x !== null);
  if (value === null || refs.length === 0) return null;
  const s = refs.map((r) => standingVs(value, r, bar));
  if (s.every((x) => x === "below")) return "below";
  if (s.every((x) => x === "above")) return "above";
  return "same";
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Store basket check. Values are the 2-decimal ones shown on screen, so the reader can redo the sum. */
export function basketFlag(o: {
  now: number | null; baseline: number | null; city: number | null; state: number | null;
  bills: number; avgItemValue: number;
}): StoreCompare["basket_flag"] {
  const { now, baseline, city, state } = o;
  if (now === null || baseline === null || city === null || state === null) return null;
  const gCity = r2(city - now), gState = r2(state - now), gBase = r2(baseline - now);
  if (gCity < TEAM_T.bar.ipb || gState < TEAM_T.bar.ipb || gBase < TEAM_T.basketBaselineGap) return null;
  const gap = Math.min(gCity, gState);
  const avg = Math.round(o.avgItemValue);
  return {
    gap_vs_peers: gap,
    rupees: round100(gap * o.bills * avg),
    avg_item_value: avg,
    formula: "gap × bills × average item value",
    display: `${now.toFixed(2)} items per bill vs ${city.toFixed(2)} city / ${state.toFixed(2)} state peers`,
  };
}

function cleanDays(input: TeamInput, days: StoreDay[]): StoreDay[] {
  const stateOf = new Map(input.stores.map((s) => [s.store_id, s.state]));
  const festival = new Set<string>();
  for (const c of input.calendar) {
    if (c.festival !== "Diwali") continue;
    for (let k = -TEAM_T.festivalDays; k <= TEAM_T.festivalDays; k++) festival.add(`${c.state}|${addDays(c.date, k)}`);
  }
  return days.filter((d) => !(d.bills > d.footfall) && !festival.has(`${stateOf.get(d.store_id)}|${d.date}`));
}

export function storeCompareRows(input: TeamInput, days: StoreDay[] = buildStoreDays(input)): StoreCompare[] {
  const w = windows(input.asOf);
  const now = w.current_28d, base = w.baseline_mayjul;
  const upto = days.filter((d) => d.date <= input.asOf);
  const clean = cleanDays(input, upto);
  const judged = new Set(input.stores.filter((s) => s.opened_on <= base.from).map((s) => s.store_id));
  const roster = input.roster.filter((r) => r.date <= input.asOf);

  const pick = (src: StoreDay[], ids: Set<string>, win: { from: string; to: string }) =>
    sumDays(src.filter((d) => ids.has(d.store_id) && inRange(d.date, win.from, win.to)));
  const conv = (ids: Set<string>, win: { from: string; to: string }) => fin(conversion(pick(clean, ids, win)));
  const ipb = (ids: Set<string>, win: { from: string; to: string }) => fin(itemsPerBill(pick(upto, ids, win)));
  const pres = (ids: Set<string>, win: { from: string; to: string }) =>
    fin(presencePct(roster.filter((r) => ids.has(r.store_id) && inRange(r.date, win.from, win.to))));

  return input.stores.map((s) => {
    const me = new Set([s.store_id]);
    const isNew = !judged.has(s.store_id);
    const peers = input.stores.filter((p) => p.store_id !== s.store_id && judged.has(p.store_id));
    const city = new Set(peers.filter((p) => p.city === s.city).map((p) => p.store_id));
    const state = new Set(peers.filter((p) => p.state === s.state).map((p) => p.store_id));
    const metric = (f: (ids: Set<string>, win: { from: string; to: string }) => number | null, bar: number): StoreMetricCompare => {
      const n = f(me, now);
      const c = city.size ? f(city, now) : null;
      const st = state.size ? f(state, now) : null;
      return {
        now: n,
        baseline: isNew ? null : f(me, base),
        city_peers: c,
        state_peers: st,
        vs_peers: isNew ? null : standingVsPeers(n, c, st, bar),
      };
    };
    const conversionC = metric(conv, TEAM_T.bar.conversion);
    const ipbC = metric(ipb, TEAM_T.bar.ipb);
    const presenceC = metric(pres, TEAM_T.bar.presence);
    const cl = pick(clean, me, now);
    const all = pick(upto, me, now);
    return {
      store_id: s.store_id,
      city: s.city,
      state: s.state,
      area_manager_id: s.area_manager_id,
      is_new: isNew,
      footfall: cl.footfall, // clean days, so bills ÷ footfall reproduces conversion
      bills: cl.bills,
      conversion: conversionC,
      ipb: ipbC,
      presence: presenceC,
      basket_flag: isNew || all.items === 0 ? null : basketFlag({
        now: ipbC.now, baseline: ipbC.baseline, city: ipbC.city_peers, state: ipbC.state_peers,
        bills: all.bills, avgItemValue: all.sales_value / all.items,
      }),
    };
  });
}

/**
 * Estimated conversion for one salesperson: bills ÷ Σ over their Present days of
 * (store footfall that day ÷ salespeople Present in that store that day) × 100.
 */
export function estConversion(o: {
  bills: number;
  presentDays: { store_id: string; date: string }[];
  footfall: Map<string, number>; // "store|date" -> walk-ins
  presentCount: Map<string, number>; // "store|date" -> salespeople Present
}): number | null {
  if (o.presentDays.length < TEAM_T.minPresentDays) return null;
  let share = 0;
  for (const p of o.presentDays) {
    const k = `${p.store_id}|${p.date}`;
    const n = o.presentCount.get(k) ?? 0;
    if (n > 0) share += (o.footfall.get(k) ?? 0) / n;
  }
  return share > 0 ? fin((o.bills / share) * 100) : null;
}

type Metric = keyof TeamRow["vs_store"];

/** Each row vs the median of the rest of its store (non-null values only). */
export function vsStore(rows: Omit<TeamRow, "vs_store">[]): TeamRow[] {
  const metrics: Metric[] = ["presence", "est_conversion", "ipb", "repeat_rate"];
  return rows.map((r) => {
    const rest = rows.filter((x) => x.store_id === r.store_id && x.salesperson_id !== r.salesperson_id);
    const vs = {} as TeamRow["vs_store"];
    for (const m of metrics) {
      const med = median(rest.map((x) => x[m]).filter((v): v is number => v !== null));
      vs[m] = standingVs(r[m], med === null ? null : r2(med), TEAM_T.spBar[m]);
    }
    return { ...r, vs_store: vs };
  });
}

export function teamRows(input: TeamInput, days: StoreDay[] = buildStoreDays(input)): TeamRow[] {
  const w = windows(input.asOf).current_28d;
  const footfall = new Map(days.map((d) => [`${d.store_id}|${d.date}`, d.footfall]));
  const lastActive = new Map<string, string>();
  const touch = (sp: string, d: string) => { if (d <= input.asOf && (lastActive.get(sp) ?? "") < d) lastActive.set(sp, d); };
  for (const r of input.roster) if (r.status === "Present") touch(r.salesperson_id, r.date);
  for (const b of input.bills) touch(b.salesperson_id, b.bill_date);

  const rosterIn = input.roster.filter((r) => inRange(r.date, w.from, w.to));
  const presentCount = new Map<string, number>();
  for (const r of rosterIn) if (r.status === "Present") presentCount.set(`${r.store_id}|${r.date}`, (presentCount.get(`${r.store_id}|${r.date}`) ?? 0) + 1);
  const rosterBySp = new Map<string, RosterRow[]>();
  for (const r of rosterIn) (rosterBySp.get(r.salesperson_id) ?? rosterBySp.set(r.salesperson_id, []).get(r.salesperson_id)!).push(r);

  const pkg = new Set(input.items.filter((i) => i.is_packaging).map((i) => i.sku_id));
  const billsIn = input.bills.filter((b) => inRange(b.bill_date, w.from, w.to));
  const spOfBill = new Map(billsIn.map((b) => [b.bill_id, b.salesperson_id]));
  const bySp = new Map<string, { bills: number; items: number }>();
  for (const b of billsIn) {
    const x = bySp.get(b.salesperson_id) ?? { bills: 0, items: 0 };
    x.bills++;
    bySp.set(b.salesperson_id, x);
  }
  for (const l of input.lines) {
    const sp = spOfBill.get(l.bill_id);
    if (!sp || pkg.has(l.sku_id)) continue;
    bySp.get(sp)!.items += l.qty;
  }
  // Repeat needs a 30-day gap after the first bill, so a 28-day window has no eligible customers.
  // Same window as salesperson_metrics (Aug-Oct) and the same min customers rule.
  const rep = repeatRate(input.bills, {
    from: "2026-08-01", to: input.asOf, asOf: input.asOf, minCustomers: MIN_REPEAT_CUSTOMERS, groupBy: (b) => b.salesperson_id,
  });

  const rows: Omit<TeamRow, "vs_store">[] = [];
  for (const sp of input.salespeople) {
    const la = lastActive.get(sp.salesperson_id);
    if (!la || la < TEAM_T.rosterFrom) continue;
    const rr = rosterBySp.get(sp.salesperson_id) ?? [];
    const present = rr.filter((r) => r.status === "Present");
    const x = bySp.get(sp.salesperson_id) ?? { bills: 0, items: 0 };
    const rp = rep.get(sp.salesperson_id);
    rows.push({
      salesperson_id: sp.salesperson_id,
      store_id: sp.store_id,
      display_name: sp.name,
      days_rostered: rr.length,
      days_present: present.length,
      presence: rr.length ? fin((present.length / rr.length) * 100) : null,
      bills: x.bills,
      est_conversion: estConversion({ bills: x.bills, presentDays: present, footfall, presentCount }),
      ipb: x.bills >= TEAM_T.minBills ? fin(x.items / x.bills) : null,
      repeat_rate: rp === undefined ? null : fin(rp),
      on_roster: rr.length > 0,
    });
  }
  return vsStore(rows);
}
