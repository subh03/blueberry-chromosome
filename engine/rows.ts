// Builds the aggregate rows that `npm run load` writes (types/index.ts shapes). Pure: no I/O.
import type { DataQualityFlag, SalespersonMetrics, StoreMetrics, WindowName } from "../types";
import {
  buildStoreDays, conversion, discountPct, inRange, itemsPerBill, presencePct, sumDays,
  type BillLineRow, type BillRow, type FootfallRow, type ItemRow, type RosterRow, type StoreDay,
} from "./metrics";
import type { StoreInfo, Window } from "./compare";
import { addDays, badConversionDays, billsExceedFootfall, newStores, rosterLeavers } from "./dq";

export const REPEAT_GAP_DAYS = 30;
export const MIN_REPEAT_CUSTOMERS = 30;
export const MIN_PAIR_BILLS = 5;
export const LEFT_AFTER_DAYS = 21;

const r2 = (n: number) => Math.round(n * 100) / 100;
const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export function windows(asOf: string): Record<WindowName, Window> {
  return {
    current_28d: { from: addDays(asOf, -27), to: asOf },
    baseline_mayjul: { from: "2026-05-01", to: "2026-07-31" },
    all_time: { from: "0000-01-01", to: asOf },
  };
}

/**
 * Repeat rate % per group. Eligible customers: first-ever bill (fleet-wide) falls in the window
 * and at least 30 days before as-of. Repeat = any later bill 30+ days after that first bill.
 * The customer is attributed to the group of their first bill. Groups below minCustomers are omitted.
 */
export function repeatRate(
  bills: BillRow[],
  o: { from: string; to: string; asOf: string; minCustomers: number; groupBy: (b: BillRow) => string },
): Map<string, number> {
  const first = new Map<string, BillRow>();
  const last = new Map<string, string>();
  for (const b of bills) {
    if (b.bill_date > o.asOf) continue;
    const f = first.get(b.customer_id);
    if (!f || b.bill_date < f.bill_date) first.set(b.customer_id, b);
    const l = last.get(b.customer_id);
    if (!l || b.bill_date > l) last.set(b.customer_id, b.bill_date);
  }
  const cutoff = addDays(o.asOf, -REPEAT_GAP_DAYS);
  const tally = new Map<string, { n: number; rep: number }>();
  for (const [cust, f] of first) {
    if (!inRange(f.bill_date, o.from, o.to) || f.bill_date > cutoff) continue;
    const g = o.groupBy(f);
    const t = tally.get(g) ?? { n: 0, rep: 0 };
    t.n += 1;
    if (dayDiff(f.bill_date, last.get(cust)!) >= REPEAT_GAP_DAYS) t.rep += 1;
    tally.set(g, t);
  }
  const out = new Map<string, number>();
  for (const [g, t] of tally) if (t.n >= o.minCustomers) out.set(g, (t.rep / t.n) * 100);
  return out;
}

export interface PairAttach { sherwani: number; sherwaniBills: number; kurta: number; kurtaBills: number }

/** Sherwani bills with Safa/Mojari/Mala, and Kurta Set bills with a Jacket, as % per group. */
export function pairAttach(bills: BillRow[], lines: BillLineRow[], items: ItemRow[], groupBy: (b: BillRow) => string): Map<string, PairAttach> {
  const cat = new Map(items.map((i) => [i.sku_id, i.category]));
  const cats = new Map<string, Set<string>>();
  for (const l of lines) {
    const c = cat.get(l.sku_id);
    if (!c) continue;
    let s = cats.get(l.bill_id);
    if (!s) cats.set(l.bill_id, (s = new Set()));
    s.add(c);
  }
  const t = new Map<string, { sb: number; sp: number; kb: number; kp: number }>();
  for (const b of bills) {
    const s = cats.get(b.bill_id);
    if (!s) continue;
    const hasS = s.has("Sherwani");
    const hasK = s.has("Kurta Set");
    if (!hasS && !hasK) continue;
    const g = groupBy(b);
    const x = t.get(g) ?? { sb: 0, sp: 0, kb: 0, kp: 0 };
    if (hasS) { x.sb++; if (s.has("Safa") || s.has("Mojari") || s.has("Mala")) x.sp++; }
    if (hasK) { x.kb++; if (s.has("Jacket")) x.kp++; }
    t.set(g, x);
  }
  const out = new Map<string, PairAttach>();
  for (const [g, x] of t) {
    out.set(g, {
      sherwani: x.sb ? (x.sp / x.sb) * 100 : NaN, sherwaniBills: x.sb,
      kurta: x.kb ? (x.kp / x.kb) * 100 : NaN, kurtaBills: x.kb,
    });
  }
  return out;
}

export interface RowsInput {
  asOf: string;
  stores: StoreInfo[];
  bills: BillRow[];
  lines: BillLineRow[];
  items: ItemRow[];
  footfall: FootfallRow[];
  roster: RosterRow[];
}

/** store_metrics rows for every store × window. Windows with no footfall or no bills are skipped. */
export function storeMetricsRows(input: RowsInput, days: StoreDay[] = buildStoreDays(input)): StoreMetrics[] {
  const bad = badConversionDays(days);
  const out: StoreMetrics[] = [];
  for (const [name, w] of Object.entries(windows(input.asOf)) as [WindowName, Window][]) {
    const rep = repeatRate(input.bills, { ...w, asOf: input.asOf, minCustomers: MIN_REPEAT_CUSTOMERS, groupBy: (b) => b.store_id });
    for (const s of input.stores) {
      const mine = days.filter((d) => d.store_id === s.store_id && inRange(d.date, w.from, w.to));
      const all = sumDays(mine);
      const clean = sumDays(mine.filter((d) => !bad.has(`${d.store_id}|${d.date}`)));
      if (clean.footfall === 0 || all.bills === 0) continue;
      const roster = name === "all_time" ? [] : input.roster.filter((r) => r.store_id === s.store_id && inRange(r.date, w.from, w.to));
      out.push({
        store_id: s.store_id,
        as_of: input.asOf,
        window: name,
        footfall: clean.footfall,
        bills: clean.bills,
        conversion: r2(conversion(clean)), // clean days only (bills > footfall days are a DQ flag)
        ipb: r2(itemsPerBill(all)),
        discount_pct: r2(discountPct(all)),
        repeat_rate: rep.has(s.store_id) ? r2(rep.get(s.store_id)!) : null,
        avg_bill_value: Math.round(all.sales_value / all.bills),
        presence: roster.length ? r2(presencePct(roster)) : null,
      });
    }
  }
  return out;
}

/**
 * salesperson_metrics for everyone active in the roster period (1 May 2026 onward).
 * Bills, IPB, discount, presence and pair attach use `window` (default Aug-Oct 2026).
 * display_name is the name as given in the data (first name + initial). Server-only table.
 */
export function salespersonMetricsRows(
  input: RowsInput & { salespeople: { salesperson_id: string; store_id: string; name: string }[] },
  window: Window = { from: "2026-08-01", to: input.asOf },
): SalespersonMetrics[] {
  const rosterFrom = "2026-05-01";
  const activity = [
    ...input.roster.filter((r) => r.status === "Present").map((r) => ({ salesperson_id: r.salesperson_id, date: r.date })),
    ...input.bills.map((b) => ({ salesperson_id: b.salesperson_id, date: b.bill_date })),
  ].filter((a) => a.date <= input.asOf);
  const lastActive = new Map<string, string>();
  for (const a of activity) if ((lastActive.get(a.salesperson_id) ?? "") < a.date) lastActive.set(a.salesperson_id, a.date);
  // Mentor rule (DECISIONS.md): "left" comes from the roster only; no sale for 3 weeks is normal.
  const left = new Set(
    rosterLeavers({ asOf: input.asOf, minGapDays: LEFT_AFTER_DAYS, salespeople: input.salespeople.map((s) => s.salesperson_id), roster: input.roster })
      .left.map((l) => l.salesperson_id),
  );

  const inWin = input.bills.filter((b) => inRange(b.bill_date, window.from, window.to));
  const billIds = new Set(inWin.map((b) => b.bill_id));
  const linesInWin = input.lines.filter((l) => billIds.has(l.bill_id));
  const pkg = new Set(input.items.filter((i) => i.is_packaging).map((i) => i.sku_id));
  const bySp = new Map<string, { bills: number; items: number; mrp: number; sales: number }>();
  const spOfBill = new Map(inWin.map((b) => [b.bill_id, b.salesperson_id]));
  for (const b of inWin) {
    const x = bySp.get(b.salesperson_id) ?? { bills: 0, items: 0, mrp: 0, sales: 0 };
    x.bills++;
    bySp.set(b.salesperson_id, x);
  }
  for (const l of linesInWin) {
    if (pkg.has(l.sku_id)) continue;
    const x = bySp.get(spOfBill.get(l.bill_id)!)!;
    x.items += l.qty;
    x.mrp += l.mrp * l.qty;
    x.sales += l.selling_price * l.qty;
  }
  const pairs = pairAttach(inWin, linesInWin, input.items, (b) => b.salesperson_id);
  const rep = repeatRate(input.bills, { ...window, asOf: input.asOf, minCustomers: MIN_REPEAT_CUSTOMERS, groupBy: (b) => b.salesperson_id });

  const out: SalespersonMetrics[] = [];
  for (const sp of input.salespeople) {
    const la = lastActive.get(sp.salesperson_id) ?? null;
    if (!la || la < rosterFrom) continue; // not active in the roster period
    const x = bySp.get(sp.salesperson_id) ?? { bills: 0, items: 0, mrp: 0, sales: 0 };
    const roster = input.roster.filter((r) => r.salesperson_id === sp.salesperson_id && inRange(r.date, window.from, window.to));
    const p = pairs.get(sp.salesperson_id);
    out.push({
      salesperson_id: sp.salesperson_id,
      store_id: sp.store_id,
      as_of: input.asOf,
      display_name: sp.name,
      bills: x.bills,
      ipb: x.bills ? r2(x.items / x.bills) : 0,
      discount_pct: x.mrp ? r2(((x.mrp - x.sales) / x.mrp) * 100) : 0,
      repeat_rate: rep.has(sp.salesperson_id) ? r2(rep.get(sp.salesperson_id)!) : null,
      presence: roster.length ? r2(presencePct(roster)) : null,
      pair_attach_sherwani: p && p.sherwaniBills >= MIN_PAIR_BILLS ? r2(p.sherwani) : null,
      pair_attach_kurta: p && p.kurtaBills >= MIN_PAIR_BILLS ? r2(p.kurta) : null,
      last_active: la,
      inferred_left: left.has(sp.salesperson_id),
    });
  }
  return out;
}

/** dq_flags rows. Never alerted. */
export function dqFlagRows(
  input: RowsInput & { calendar: { date: string; festival: string }[]; salespeople: { salesperson_id: string; store_id: string }[] },
  days: StoreDay[] = buildStoreDays(input),
): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];
  const pkg = new Set(input.items.filter((i) => i.is_packaging).map((i) => i.sku_id));
  flags.push({
    id: "dq:packaging_rows", store_id: null, kind: "packaging_rows", alerted: false,
    rows_affected: input.lines.filter((l) => pkg.has(l.sku_id)).length,
    detail: "Packaging lines (₹0 bags, covers, boxes) are left out of items per bill and discount",
  });
  for (const b of billsExceedFootfall(days)) {
    flags.push({
      id: `dq:bills_exceed_footfall:${b.store_id}`, store_id: b.store_id, kind: "bills_exceed_footfall", alerted: false,
      rows_affected: b.days,
      detail: `${b.days} store-days with more bills than walk-ins; those days are left out of conversion`,
    });
  }
  for (const s of newStores(input.stores, windows(input.asOf).baseline_mayjul.from)) {
    flags.push({
      id: `dq:new_store_no_baseline:${s.store_id}`, store_id: s.store_id, kind: "new_store_no_baseline", alerted: false,
      rows_affected: days.filter((d) => d.store_id === s.store_id).length,
      detail: `Opened ${s.opened_on}: too new to judge, left out of peer comparisons`,
    });
  }
  const spStore = new Map(input.salespeople.map((s) => [s.salesperson_id, s.store_id]));
  const lv = rosterLeavers({ asOf: input.asOf, minGapDays: LEFT_AFTER_DAYS, salespeople: [...spStore.keys()], roster: input.roster });
  const leftByStore = new Map<string, number>();
  for (const l of lv.left) { const st = spStore.get(l.salesperson_id)!; leftByStore.set(st, (leftByStore.get(st) ?? 0) + 1); }
  for (const [store_id, n] of [...leftByStore].sort()) {
    flags.push({
      id: `dq:staff_no_exit_date:${store_id}`, store_id, kind: "staff_no_exit_date", alerted: false, rows_affected: n,
      detail: `${n} salesperson(s) dropped off the roster ${LEFT_AFTER_DAYS}+ days before ${input.asOf}; no exit date recorded, so treated as inferred left`,
    });
  }
  const festivals = [...new Set(input.calendar.filter((c) => c.festival === "Diwali" && c.date <= input.asOf).map((c) => c.date))];
  for (const d of festivals) {
    const fest = sumDays(days.filter((x) => inRange(x.date, addDays(d, -3), addDays(d, 3))));
    const prior = sumDays(days.filter((x) => inRange(x.date, addDays(d, -24), addDays(d, -4))));
    if (prior.bills === 0) continue;
    const change = ((fest.bills / 7 - prior.bills / 21) / (prior.bills / 21)) * 100;
    flags.push({
      id: `dq:festival_dip:${d}`, store_id: null, kind: "festival_dip", alerted: false, rows_affected: fest.days,
      detail: `Diwali ${d}: bills per day ${change >= 0 ? "+" : ""}${Math.round(change)}% vs the 3 weeks before; ±3 days left out of baselines`,
    });
  }
  return flags;
}
