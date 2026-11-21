// Problem detectors. Owner: Naman. Pure: callers pass parsed rows, nothing is read or printed here.
// Every detector compares a store or salesperson with peers (same store, city, state) and returns
// Issues whose evidence lists each number with its formula and row count. The LLM never computes.
//
// Data-quality guard (DECISIONS.md):
// - conversion uses clean store-days only: days with bills > recorded walk-ins are dropped (PAT-03),
//   and so are Diwali ±3 days in the store's state (normal festival swing, not a problem);
// - stores opened after the baseline starts (BLR-05) are never judged and never used as peers;
// - "left" comes from the roster only (mentor rule). No sale for 3 weeks is normal.
import type { Evidence, EvidenceStep, Issue, IssueAction, IssueType, Lever } from "../types";
import {
  buildStoreDays, conversion, inRange, sumDays,
  type BillLineRow, type BillRow, type FootfallRow, type ItemRow, type RosterRow, type StoreDay, type Totals,
} from "./metrics";
import { addDays, rosterLeavers } from "./dq";
import { rupeesAtStake, rupeesFromRate } from "./rupees";

// ---------------------------------------------------------------- thresholds
export const T = {
  convGapPts: 1.0, // store change minus peer change, must be past this vs BOTH city and state peers
  convZ: 2.0, // the store's own before/after drop must be statistically real
  footfallSteadyPct: 10, // "walk-ins steady": store footfall change within ±10% of city peers'
  festivalDays: 3, // ±3 days around Diwali left out of every window
  leftMinDays: 21, // roster rows stop 21+ days before as-of = left
  topSellerX: 1.3, // "good salesperson": bill share ≥ 1.3× an even split, and rank 1 or 2
  missedShiftPts: 15, // presence fell 15+ points while the rest of the store held
  weekendHeadDropPct: 7, // weekend people-on-floor fell 7%+ ...
  weekendHeadDropMin: 0.5, // ... and by at least half a person
  citySlowPct: 8, // city walk-ins vs the rest of the fleet, last 28 days vs May-Jul
  cityStoreSlowPct: 5, // every store in the city must be down this much
  citySeasonGapPct: 6, // and worse than the same weeks last year by this much
  pairMinBills: 15, pairOthersMin: 30, pairGapPts: 5, pairP: 0.001, // exact binomial lower tail
  catMinBills: 100, catZ: 4, catShareX: 0.5,
  discMinLines: 60, discGapPts: 2, discX: 2,
  repMin: 60, roleZ: 5, roleX: 2, lowRepMin: 150, lowRepZ: 4,
} as const;

const PAIRS = [
  { base: "Sherwani", adds: ["Safa", "Mojari", "Mala"], addLabel: "safa, mojari or mala", show: "Show a safa and mojari with every sherwani trial" },
  { base: "Kurta Set", adds: ["Jacket"], addLabel: "jacket", show: "Show a jacket with every kurta trial" },
] as const;
const AVOID_CATS = ["Sherwani", "Indo-Western", "Kurta Set", "Stole"]; // add-ons are the pair problem

// ---------------------------------------------------------------- input + context
export interface DetectInput {
  asOf: string;
  stores: { store_id: string; city: string; state: string; tier: string; opened_on: string; area_manager_id: string }[];
  bills: BillRow[];
  lines: BillLineRow[];
  items: ItemRow[];
  footfall: FootfallRow[];
  roster: RosterRow[];
  salespeople: { salesperson_id: string; store_id: string; name: string }[];
  calendar: { date: string; state: string; festival: string }[];
}

interface Win { from: string; to: string; label: string }

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayMon = (d: string) => `${Number(d.slice(8, 10))} ${MON[Number(d.slice(5, 7)) - 1]}`;
const monthStart = (d: string, back: number) => {
  const x = new Date(`${d.slice(0, 7)}-01T00:00:00Z`);
  x.setUTCMonth(x.getUTCMonth() - back);
  return x.toISOString().slice(0, 10);
};
const span = (from: string, to: string) => `${MON[Number(from.slice(5, 7)) - 1]}-${MON[Number(to.slice(5, 7)) - 1]} ${to.slice(0, 4)}`;
const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export interface Ctx {
  in: DetectInput;
  asOf: string;
  base: Win; // 3 calendar months before `recent` (May-Jul 2026)
  recent: Win; // the 3 calendar months ending at as-of (Aug-Oct 2026)
  cur28: Win; // last 28 days: ₹ at stake inputs
  year: Win; // last 12 months: salesperson habits
  store: Map<string, DetectInput["stores"][number]>;
  judged: Set<string>; // stores with a full baseline (not brand new)
  clean: Map<string, StoreDay[]>; // per store, clean days for conversion
  all: Map<string, StoreDay[]>; // per store, every day (bills, values)
  name: Map<string, string>;
  spStore: Map<string, string>;
  left: Map<string, string>; // salesperson -> last roster day
  rosterCovers: boolean;
  active: (sp: string) => boolean;
  billCats: Map<string, Set<string>>;
  billValue: Map<string, { mrp: number; sales: number; lines: number; byCat: Map<string, number> }>;
  presentByStoreDay: Map<string, number>;
}

export function buildContext(input: DetectInput): Ctx {
  const asOf = input.asOf;
  const recent: Win = { from: monthStart(asOf, 2), to: asOf, label: "" };
  recent.label = span(recent.from, recent.to);
  const base: Win = { from: monthStart(asOf, 5), to: addDays(recent.from, -1), label: "" };
  base.label = span(base.from, base.to);
  const cur28: Win = { from: addDays(asOf, -27), to: asOf, label: "last 28 days" };
  const year: Win = { from: addDays(asOf, -364), to: asOf, label: "last 12 months" };

  const days = buildStoreDays(input);
  const stateOf = new Map(input.stores.map((s) => [s.store_id, s.state]));
  const festival = new Set<string>();
  for (const c of input.calendar) {
    if (c.festival !== "Diwali") continue;
    for (let k = -T.festivalDays; k <= T.festivalDays; k++) festival.add(`${c.state}|${addDays(c.date, k)}`);
  }
  const clean = new Map<string, StoreDay[]>();
  const all = new Map<string, StoreDay[]>();
  for (const d of days.sort((a, b) => a.date.localeCompare(b.date))) {
    if (d.date > asOf) continue;
    (all.get(d.store_id) ?? all.set(d.store_id, []).get(d.store_id)!).push(d);
    if (d.bills > d.footfall || festival.has(`${stateOf.get(d.store_id)}|${d.date}`)) continue;
    (clean.get(d.store_id) ?? clean.set(d.store_id, []).get(d.store_id)!).push(d);
  }

  const lv = rosterLeavers({ asOf, minGapDays: T.leftMinDays, salespeople: input.salespeople.map((s) => s.salesperson_id), roster: input.roster.filter((r) => r.date <= asOf) });
  const left = new Map(lv.left.map((l) => [l.salesperson_id, l.last_on_roster]));
  const lastRoster = new Map<string, string>();
  const presentByStoreDay = new Map<string, number>();
  for (const r of input.roster) {
    if (r.date > asOf) continue;
    if ((lastRoster.get(r.salesperson_id) ?? "") < r.date) lastRoster.set(r.salesperson_id, r.date);
    if (r.status === "Present") presentByStoreDay.set(`${r.store_id}|${r.date}`, (presentByStoreDay.get(`${r.store_id}|${r.date}`) ?? 0) + 1);
  }
  const rosterCovers = input.roster.some((r) => inRange(r.date, cur28.from, asOf));
  const lastBill = new Map<string, string>();
  for (const b of input.bills) if (b.bill_date <= asOf && (lastBill.get(b.salesperson_id) ?? "") < b.bill_date) lastBill.set(b.salesperson_id, b.bill_date);
  const active = (sp: string) =>
    rosterCovers
      ? !left.has(sp) && lastRoster.has(sp) && dayDiff(lastRoster.get(sp)!, asOf) < T.leftMinDays
      : (lastBill.get(sp) ?? "") >= addDays(asOf, -60);

  const cat = new Map(input.items.map((i) => [i.sku_id, i]));
  const billCats = new Map<string, Set<string>>();
  const billValue: Ctx["billValue"] = new Map();
  for (const l of input.lines) {
    const it = cat.get(l.sku_id);
    if (!it || it.is_packaging) continue;
    (billCats.get(l.bill_id) ?? billCats.set(l.bill_id, new Set()).get(l.bill_id)!).add(it.category);
    const v = billValue.get(l.bill_id) ?? billValue.set(l.bill_id, { mrp: 0, sales: 0, lines: 0, byCat: new Map() }).get(l.bill_id)!;
    v.mrp += l.mrp * l.qty;
    v.sales += l.selling_price * l.qty;
    v.lines += 1;
    v.byCat.set(it.category, (v.byCat.get(it.category) ?? 0) + l.selling_price * l.qty);
  }

  return {
    in: input, asOf, base, recent, cur28, year,
    store: new Map(input.stores.map((s) => [s.store_id, s])),
    judged: new Set(input.stores.filter((s) => s.opened_on <= base.from).map((s) => s.store_id)),
    clean, all,
    name: new Map(input.salespeople.map((s) => [s.salesperson_id, s.name])),
    spStore: new Map(input.salespeople.map((s) => [s.salesperson_id, s.store_id])),
    left, rosterCovers, active, billCats, billValue, presentByStoreDay,
  };
}

// ---------------------------------------------------------------- formatting + evidence
const r2 = (n: number) => Math.round(n * 100) / 100;
export const fmt = {
  pct: (n: number) => `${n.toFixed(1)}%`,
  pts: (n: number) => `${n.toFixed(1)} pts`,
  int: (n: number) => Math.round(n).toLocaleString("en-IN"),
  rupees: (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`,
  signedPct: (n: number) => `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(1)}%`,
  one: (n: number) => n.toFixed(1),
};

/** Number-looking tokens a reader would see, ignoring IDs such as LKO-02 or SP1018. */
export function numberTokens(text: string): string[] {
  return text.match(/(?<![A-Za-z0-9\-])₹?\d+(?:,\d+)*(?:\.\d+)?%?/g) ?? [];
}

const step = (label: string, value: number, display: string, formula: string, rows: number, compare_to?: EvidenceStep["compare_to"]): EvidenceStep =>
  ({ label, value: r2(value), display, formula, rows, ...(compare_to ? { compare_to } : {}) });

function evidence(o: Omit<Evidence, "allowedNumbers">): Evidence {
  const allowed = new Set<string>();
  for (const s of o.steps) {
    for (const t of [s.display, s.compare_to?.display].filter(Boolean) as string[]) {
      allowed.add(t);
      numberTokens(t).forEach((x) => allowed.add(x));
    }
    for (const t of [s.label, s.compare_to?.label ?? ""]) numberTokens(t).forEach((x) => allowed.add(x));
  }
  return { ...o, allowedNumbers: [...allowed] };
}

function issue(ctx: Ctx, o: {
  store_id: string; lever: Lever; type: IssueType; rupees: number; cause: string; action: IssueAction;
  steps: EvidenceStep[]; peer: Evidence["peer"]; subject?: Evidence["subject"]; idSuffix?: string;
}): Issue {
  const s = ctx.store.get(o.store_id)!;
  return {
    id: `${ctx.asOf}:${o.store_id}:${o.type}${o.idSuffix ? `:${o.idSuffix}` : ""}`,
    as_of: ctx.asOf,
    store_id: o.store_id,
    area_manager_id: s.area_manager_id,
    lever: o.lever,
    type: o.type,
    rupees_at_stake: o.rupees,
    rank: 1, // set by rankIssues
    cause: o.cause,
    action: o.action,
    evidence: evidence({
      store_id: o.store_id, as_of: ctx.asOf, lever: o.lever, type: o.type, steps: o.steps, cause: o.cause,
      peer: o.peer, subject: o.subject ?? null,
    }),
    followup: null,
  };
}

// ---------------------------------------------------------------- store totals + peer comparison
type DayFilter = (d: StoreDay) => boolean;
function tot(ctx: Ctx, ids: string[], w: { from: string; to: string }, f: DayFilter = () => true, which: "clean" | "all" = "clean"): Totals {
  const src = which === "clean" ? ctx.clean : ctx.all;
  return sumDays(ids.flatMap((id) => (src.get(id) ?? []).filter((d) => inRange(d.date, w.from, w.to) && f(d))));
}

function peersOf(ctx: Ctx, storeId: string) {
  const me = ctx.store.get(storeId)!;
  const ok = [...ctx.judged].filter((id) => id !== storeId);
  return {
    city: ok.filter((id) => ctx.store.get(id)!.city === me.city),
    state: ok.filter((id) => ctx.store.get(id)!.state === me.state),
  };
}

interface ConvCheck {
  store: { before: number; after: number; A: Totals; B: Totals };
  city: { before: number; after: number } | null;
  state: { before: number; after: number } | null;
  gap: number; // conservative: the smaller drop vs peers, in points (negative = worse than peers)
  z: number; // the store's own drop, two-proportion z (positive = real drop)
}

function convCheck(ctx: Ctx, storeId: string, a: { from: string; to: string }, b: { from: string; to: string }, f?: DayFilter): ConvCheck | null {
  const p = peersOf(ctx, storeId);
  const A = tot(ctx, [storeId], a, f);
  const B = tot(ctx, [storeId], b, f);
  if (A.footfall === 0 || B.footfall === 0) return null;
  const pair = (ids: string[]) => {
    if (!ids.length) return null;
    const pa = tot(ctx, ids, a, f), pb = tot(ctx, ids, b, f);
    return pa.footfall && pb.footfall ? { before: conversion(pa), after: conversion(pb) } : null;
  };
  const city = pair(p.city);
  const state = pair(p.state);
  if (!city && !state) return null;
  const sChg = conversion(B) - conversion(A);
  const gaps = [city, state].filter(Boolean).map((x) => sChg - (x!.after - x!.before));
  const pool = (A.bills + B.bills) / (A.footfall + B.footfall);
  const se = Math.sqrt(pool * (1 - pool) * (1 / A.footfall + 1 / B.footfall));
  return {
    store: { before: conversion(A), after: conversion(B), A, B },
    city, state,
    gap: Math.max(...gaps),
    z: se ? (conversion(A) - conversion(B)) / 100 / se : 0,
  };
}

const fails = (c: ConvCheck | null): c is ConvCheck => !!c && c.gap <= -T.convGapPts && c.z >= T.convZ;

/** Steps shared by every conversion issue: store, peers, gap, the three ₹ inputs and ₹ itself. */
function conversionSteps(ctx: Ctx, storeId: string, c: ConvCheck, o: { afterLabel: string; beforeLabel: string; f?: DayFilter; scope?: string }) {
  const scope = o.scope ? ` (${o.scope})` : "";
  const ff = tot(ctx, [storeId], ctx.cur28, o.f);
  const val = tot(ctx, [storeId], ctx.cur28, () => true, "all");
  const abv = val.bills ? val.sales_value / val.bills : 0;
  const gapPts = r2(-c.gap);
  const rupees = rupeesAtStake({ gapPts, footfall: ff.footfall, avgBillValue: Math.round(abv) });
  const steps: EvidenceStep[] = [
    step(`Conversion${scope}, ${o.afterLabel}`, c.store.after, fmt.pct(c.store.after), "bills ÷ footfall × 100, clean days", c.store.B.days,
      { label: `Same store, ${o.beforeLabel}`, value: r2(c.store.before), display: fmt.pct(c.store.before) }),
  ];
  if (c.city) steps.push(step(`City peers' conversion${scope}, ${o.afterLabel}`, c.city.after, fmt.pct(c.city.after), "pooled bills ÷ footfall × 100, same-city stores", 0,
    { label: o.beforeLabel, value: r2(c.city.before), display: fmt.pct(c.city.before) }));
  if (c.state) steps.push(step(`State peers' conversion${scope}, ${o.afterLabel}`, c.state.after, fmt.pct(c.state.after), "pooled bills ÷ footfall × 100, same-state stores", 0,
    { label: o.beforeLabel, value: r2(c.state.before), display: fmt.pct(c.state.before) }));
  steps.push(
    step("Conversion gap vs peers", gapPts, fmt.pts(gapPts), "−(store change − peer change); the smaller of the city and state gaps", c.store.A.days + c.store.B.days),
    step(`Walk-ins (footfall)${scope}, last 28 days`, ff.footfall, fmt.int(ff.footfall), "Σ footfall, clean days", ff.days),
    step("Average bill value, last 28 days", Math.round(abv), fmt.rupees(abv), "Σ qty × selling price ÷ bills", val.bills),
    step("₹ at stake, next 28 days", rupees, fmt.rupees(rupees), "gap ÷ 100 × walk-ins × average bill value", ff.days),
  );
  return { steps, rupees };
}

/** Same-store seller with the most bills in a window (active only). */
function storeLead(ctx: Ctx, storeId: string, w: { from: string; to: string }, exclude: string[] = []) {
  const n = new Map<string, number>();
  for (const b of ctx.in.bills) {
    if (b.store_id !== storeId || !inRange(b.bill_date, w.from, w.to) || exclude.includes(b.salesperson_id) || !ctx.active(b.salesperson_id)) continue;
    n.set(b.salesperson_id, (n.get(b.salesperson_id) ?? 0) + 1);
  }
  const top = [...n].sort((a, b) => b[1] - a[1])[0];
  return top ? { salesperson_id: top[0], display_name: ctx.name.get(top[0]) ?? top[0], bills: top[1] } : null;
}

// ---------------------------------------------------------------- More bills
/** A good salesperson has left (roster stopped) or keeps missing shifts, and conversion fell vs peers. */
export function detectStaffAbsentOrLeft(ctx: Ctx): Issue[] {
  const out: Issue[] = [];
  for (const [sp, last] of ctx.left) {
    const storeId = ctx.spStore.get(sp)!;
    if (!ctx.judged.has(storeId) || last < addDays(ctx.recent.from, -30)) continue;
    // Before = the store's own baseline (May-Jul) when they left after it; else the 8 weeks before leaving.
    const before = last > ctx.base.to ? { from: ctx.base.from, to: ctx.base.to } : { from: addDays(last, -55), to: last };
    const beforeLabel = last > ctx.base.to ? ctx.base.label : "8 weeks before";
    const after = { from: addDays(last, 1), to: ctx.asOf };
    const share = billShare(ctx, storeId, sp, { from: addDays(last, -89), to: last });
    if (!share || share.rank > 2 || share.share < (T.topSellerX * 100) / share.sellers) continue;
    const c = convCheck(ctx, storeId, before, after);
    if (!fails(c)) continue;
    const nm = ctx.name.get(sp) ?? sp;
    const peer = storeLead(ctx, storeId, after, [sp]);
    const { steps, rupees } = conversionSteps(ctx, storeId, c, { afterLabel: `since ${dayMon(after.from)}`, beforeLabel });
    steps.unshift(
      step(`${nm}'s share of store bills, 90 days before leaving`, share.share, fmt.pct(share.share), "seller bills ÷ store bills × 100", share.storeBills),
      step(`${nm} last on roster`, dayDiff(last, ctx.asOf), dayMon(last), "last roster row (Present or Off); no exit date is recorded", 1),
    );
    out.push(issue(ctx, {
      store_id: storeId, lever: "more_bills", type: "staff_absent_or_left", rupees, steps,
      cause: `Top seller ${nm} (${fmt.pct(share.share)} of bills) not on roster since ${dayMon(last)}; conversion ${fmt.pct(c.store.before)} → ${fmt.pct(c.store.after)} while peers held.`,
      action: peer
        ? { who: `Store manager, ${storeId}`, what: `Put ${peer.display_name} on the floor at the busiest hours and have the newest seller shadow them`, when: "This Saturday and Sunday" }
        : { who: `Store manager, ${storeId}`, what: "Put your strongest seller on the floor at the busiest hours", when: "This Saturday and Sunday" },
      peer: peer ? { ...pick(peer), why: `Most bills in ${storeId} since ${dayMon(after.from)}` } : null,
    }));
  }
  // Keeps missing shifts: still on the roster, presence fell while the rest of the store held.
  if (!ctx.rosterCovers) return out;
  for (const s of ctx.in.salespeople) {
    const sp = s.salesperson_id;
    if (!ctx.active(sp) || !ctx.judged.has(s.store_id)) continue;
    const pr = presenceOf(ctx, (r) => r.salesperson_id === sp);
    const others = presenceOf(ctx, (r) => r.store_id === s.store_id && r.salesperson_id !== sp);
    if (pr.base === null || pr.recent === null || others.base === null || others.recent === null) continue;
    if (pr.base - pr.recent < T.missedShiftPts || others.base - others.recent >= 5) continue;
    const share = billShare(ctx, s.store_id, sp, ctx.base);
    if (!share || share.share < 100 / share.sellers) continue;
    const c = convCheck(ctx, s.store_id, ctx.base, ctx.recent);
    if (!fails(c)) continue;
    const nm = ctx.name.get(sp) ?? sp;
    const { steps, rupees } = conversionSteps(ctx, s.store_id, c, { afterLabel: ctx.recent.label, beforeLabel: ctx.base.label });
    steps.unshift(step(`${nm}'s shifts worked, ${ctx.recent.label}`, pr.recent, fmt.pct(pr.recent), "Present ÷ roster rows × 100", pr.rows,
      { label: ctx.base.label, value: r2(pr.base), display: fmt.pct(pr.base) }));
    out.push(issue(ctx, {
      store_id: s.store_id, lever: "more_bills", type: "staff_absent_or_left", rupees, steps, idSuffix: sp,
      cause: `${nm} worked ${fmt.pct(pr.recent)} of rostered days (was ${fmt.pct(pr.base)}); conversion ${fmt.pct(c.store.before)} → ${fmt.pct(c.store.after)}.`,
      action: { who: `Store manager, ${s.store_id}`, what: `Agree ${nm}'s shifts for the week with them and fix the weekly off`, when: "Today" },
      peer: null, subject: { salesperson_id: sp, display_name: nm },
    }));
  }
  return out;
}

/** Too few people on the floor on busy days (Sat/Sun), and weekend conversion fell vs peers' weekends. */
export function detectUnderstaffedBusyDays(ctx: Ctx): Issue[] {
  if (!ctx.rosterCovers) return [];
  const out: Issue[] = [];
  const weekend = (d: StoreDay) => { const w = new Date(`${d.date}T00:00:00Z`).getUTCDay(); return w === 0 || w === 6; };
  const weekday = (d: StoreDay) => !weekend(d);
  for (const storeId of ctx.judged) {
    const head = (w: Win, f: DayFilter) => {
      const ds = (ctx.all.get(storeId) ?? []).filter((d) => inRange(d.date, w.from, w.to) && f(d));
      const withRoster = ds.filter((d) => ctx.presentByStoreDay.has(`${storeId}|${d.date}`));
      if (withRoster.length < 8) return null;
      return withRoster.reduce((a, d) => a + ctx.presentByStoreDay.get(`${storeId}|${d.date}`)!, 0) / withRoster.length;
    };
    const wb = head(ctx.base, weekend), wr = head(ctx.recent, weekend), db = head(ctx.base, weekday), dr = head(ctx.recent, weekday);
    if (wb === null || wr === null || db === null || dr === null) continue;
    const drop = wb - wr;
    const dropPct = (drop / wb) * 100;
    const weekdayDropPct = ((db - dr) / db) * 100;
    if (dropPct < T.weekendHeadDropPct || drop < T.weekendHeadDropMin || weekdayDropPct > dropPct / 2) continue;
    const c = convCheck(ctx, storeId, ctx.base, ctx.recent, weekend);
    if (!fails(c)) continue;
    // who stopped working weekends
    const who: { sp: string; base: number; recent: number }[] = [];
    for (const s of ctx.in.salespeople.filter((x) => x.store_id === storeId && ctx.active(x.salesperson_id))) {
      const p = presenceOf(ctx, (r) => r.salesperson_id === s.salesperson_id && isWeekendDate(r.date));
      if (p.base !== null && p.recent !== null && p.base - p.recent >= 20) who.push({ sp: s.salesperson_id, base: p.base, recent: p.recent });
    }
    who.sort((a, b) => b.base - b.recent - (a.base - a.recent));
    const names = who.slice(0, 2).map((w) => ctx.name.get(w.sp) ?? w.sp);
    const target = Math.round(wb);
    const { steps, rupees } = conversionSteps(ctx, storeId, c, { afterLabel: ctx.recent.label, beforeLabel: ctx.base.label, f: weekend, scope: "Sat and Sun" });
    steps.unshift(
      step(`People on the floor, Sat and Sun, ${ctx.recent.label}`, wr, fmt.one(wr), "average Present roster rows per weekend day", 0,
        { label: ctx.base.label, value: r2(wb), display: fmt.one(wb) }),
      step(`People on the floor, weekdays, ${ctx.recent.label}`, dr, fmt.one(dr), "average Present roster rows per weekday", 0,
        { label: ctx.base.label, value: r2(db), display: fmt.one(db) }),
      ...who.slice(0, 2).map((w) => step(`${ctx.name.get(w.sp) ?? w.sp}'s weekend shifts worked, ${ctx.recent.label}`, w.recent, fmt.pct(w.recent), "Present ÷ weekend roster rows × 100", 0,
        { label: ctx.base.label, value: r2(w.base), display: fmt.pct(w.base) })),
      step("Weekend floor target", target, String(target), `${ctx.base.label} weekend average, rounded`, 0),
    );
    out.push(issue(ctx, {
      store_id: storeId, lever: "more_bills", type: "understaffed_busy_days", rupees, steps,
      cause: `Fewer people on the floor on Sat and Sun (${fmt.one(wb)} → ${fmt.one(wr)})${names.length ? `; ${names.join(" and ")} stopped working weekends` : ""}. Weekend conversion ${fmt.pct(c.store.before)} → ${fmt.pct(c.store.after)}.`,
      action: {
        who: `Store manager, ${storeId}`,
        what: names.length ? `Keep ${target} people on the floor; move ${names.join("'s and ")}'s weekly off to a weekday` : `Keep ${target} people on the floor`,
        when: "This Saturday and Sunday",
      },
      peer: null,
    }));
  }
  return out;
}

/** Walk-ins steady but fewer of them buying, vs both city and state peers. */
export function detectConversionDrop(ctx: Ctx): Issue[] {
  const out: Issue[] = [];
  for (const storeId of ctx.judged) {
    const c = convCheck(ctx, storeId, ctx.base, ctx.recent);
    if (!fails(c)) continue;
    const perDay = (ids: string[], w: Win) => { const t = tot(ctx, ids, w); return t.days ? t.footfall / t.days : 0; };
    const city = peersOf(ctx, storeId).city;
    const chg = (ids: string[]) => (perDay(ids, ctx.recent) / perDay(ids, ctx.base) - 1) * 100;
    const mine = chg([storeId]);
    const rel = city.length ? mine - chg(city) : mine;
    if (!Number.isFinite(rel) || Math.abs(rel) > T.footfallSteadyPct) continue;
    const { steps, rupees } = conversionSteps(ctx, storeId, c, { afterLabel: ctx.recent.label, beforeLabel: ctx.base.label });
    steps.unshift(step(`Walk-ins per day vs city peers, ${ctx.recent.label}`, rel, fmt.signedPct(rel), "store change in footfall/day minus city peers' change", 0));
    const peer = storeLead(ctx, storeId, ctx.recent);
    out.push(issue(ctx, {
      store_id: storeId, lever: "more_bills", type: "conversion_drop_footfall_steady", rupees, steps,
      cause: `Walk-ins steady (${fmt.signedPct(rel)} vs city peers) but conversion ${fmt.pct(c.store.before)} → ${fmt.pct(c.store.after)}; peers did not fall as much.`,
      action: {
        who: `Store manager, ${storeId}`,
        what: peer ? `Have ${peer.display_name} greet walk-ins and hand each one to a free seller; ask every walk-out what they were looking for` : "Greet every walk-in and ask every walk-out what they were looking for",
        when: "Today, all day",
      },
      peer: peer ? { ...pick(peer), why: `Most bills in ${storeId}, ${ctx.recent.label}` } : null,
    }));
  }
  return out;
}

/** A whole city slowing down: a market note for the area manager, never a store alert. */
export function detectCitySlowdown(ctx: Ctx): Issue[] {
  const out: Issue[] = [];
  const cities = new Map<string, string[]>();
  for (const id of ctx.judged) {
    const c = ctx.store.get(id)!.city;
    cities.set(c, [...(cities.get(c) ?? []), id]);
  }
  const lastYear = (w: { from: string; to: string }) => ({ from: addDays(w.from, -364), to: addDays(w.to, -364) });
  const idx = (ids: string[], rest: string[], w: { from: string; to: string }) => {
    const a = tot(ctx, ids, w), b = tot(ctx, rest, w);
    return a.days && b.days ? (a.footfall / a.days) / (b.footfall / b.days) : NaN;
  };
  for (const [city, ids] of cities) {
    if (ids.length < 2) continue;
    const rest = [...ctx.judged].filter((id) => !ids.includes(id));
    const chg = (x: string[], w1: { from: string; to: string }, w2: { from: string; to: string }) => (idx(x, rest, w2) / idx(x, rest, w1) - 1) * 100;
    const now = chg(ids, ctx.base, ctx.cur28);
    const per = ids.map((id) => ({ id, chg: chg([id], ctx.base, ctx.cur28) }));
    const ly = chg(ids, lastYear(ctx.base), lastYear(ctx.cur28));
    if (!(now <= -T.citySlowPct) || !per.every((p) => p.chg <= -T.cityStoreSlowPct)) continue;
    if (Number.isFinite(ly) && now - ly > -T.citySeasonGapPct) continue;
    const t = tot(ctx, ids, ctx.cur28);
    const v = tot(ctx, ids, ctx.cur28, () => true, "all");
    const lost = t.footfall * (1 / (1 + now / 100) - 1);
    const conv = conversion(t);
    const abv = v.bills ? v.sales_value / v.bills : 0;
    const rupees = rupeesFromRate({ gapPts: conv, base: lost, rupeesPerUnit: Math.round(abv) });
    const biggest = [...ids].sort((a, b) => tot(ctx, [b], ctx.cur28).footfall - tot(ctx, [a], ctx.cur28).footfall)[0];
    const steps = [
      step(`${city} stores compared`, ids.length, String(ids.length), "stores in the city with a full baseline", ids.length),
      step(`${city} walk-ins vs the rest of the fleet, last 28 days`, now, fmt.signedPct(now), `(city footfall/day ÷ rest-of-fleet footfall/day), last 28 days vs ${ctx.base.label}`, t.days),
      ...per.map((p) => step(`${p.id} walk-ins vs the rest of the fleet`, p.chg, fmt.signedPct(p.chg), "same, one store", 0)),
      ...(Number.isFinite(ly) ? [step("Same weeks last year", ly, fmt.signedPct(ly), "same comparison, 52 weeks earlier (season check)", 0)] : []),
      step("Walk-ins lost, last 28 days", lost, fmt.int(lost), "city footfall × (1 ÷ (1 + change) − 1)", t.days),
      step("City conversion, last 28 days", conv, fmt.pct(conv), "bills ÷ footfall × 100", t.days),
      step("Average bill value, last 28 days", Math.round(abv), fmt.rupees(abv), "Σ qty × selling price ÷ bills", v.bills),
      step("₹ at stake, next 28 days", rupees, fmt.rupees(rupees), "walk-ins lost × conversion × average bill value", t.days),
    ];
    out.push(issue(ctx, {
      store_id: biggest, lever: "more_bills", type: "city_slowdown", rupees, steps,
      cause: `All ${ids.length} ${city} stores lost walk-ins vs the rest of the fleet in the last 28 days (${per.map((p) => `${p.id} ${fmt.signedPct(p.chg)}`).join(", ")})${Number.isFinite(ly) ? `; the same weeks last year: ${fmt.signedPct(ly)}` : ""}. A market slowdown, not one store's problem.`,
      action: { who: `Area manager, ${city}`, what: "Treat it as a market dip: ask each store manager what changed locally and keep store targets as they are", when: "This week" },
      peer: null,
    }));
  }
  return out;
}

// ---------------------------------------------------------------- Bigger baskets
interface SpBills { sp: string; store: string; bills: BillRow[] }
function billsBySp(ctx: Ctx, w: { from: string; to: string }): Map<string, SpBills> {
  const m = new Map<string, SpBills>();
  for (const b of ctx.in.bills) {
    if (!inRange(b.bill_date, w.from, w.to)) continue;
    const x = m.get(b.salesperson_id) ?? m.set(b.salesperson_id, { sp: b.salesperson_id, store: b.store_id, bills: [] }).get(b.salesperson_id)!;
    x.bills.push(b);
  }
  return m;
}
/** P(Y ≤ y) for Y ~ Binomial(n, p). Exact, in log space (small counts make the normal approximation too loose). */
export function binomLowerTail(y: number, n: number, p: number): number {
  if (p <= 0) return 1;
  if (p >= 1) return y >= n ? 1 : 0;
  let logC = 0, sum = 0;
  for (let k = 0; k <= y; k++) {
    if (k > 0) logC += Math.log(n - k + 1) - Math.log(k);
    sum += Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  return Math.min(1, sum);
}
const zLow = (y: number, n: number, p: number) => (n && p > 0 && p < 1 ? (y - n * p) / Math.sqrt(n * p * (1 - p)) : 0);

/** Not adding the obvious pair (safa/mojari/mala with sherwani; jacket with kurta), vs the rest of the store. */
export function detectMissingPair(ctx: Ctx): Issue[] {
  const out: Issue[] = [];
  const by = billsBySp(ctx, ctx.year);
  const rate = (bills: BillRow[], base: string, adds: readonly string[]) => {
    let n = 0, y = 0;
    for (const b of bills) {
      const c = ctx.billCats.get(b.bill_id);
      if (!c?.has(base)) continue;
      n++;
      if (adds.some((a) => c.has(a))) y++;
    }
    return { n, y };
  };
  for (const x of by.values()) {
    if (!ctx.active(x.sp) || !ctx.judged.has(x.store)) continue;
    const others = [...by.values()].filter((o) => o.store === x.store && o.sp !== x.sp).flatMap((o) => o.bills);
    let best: Issue | null = null;
    for (const pair of PAIRS) {
      const me = rate(x.bills, pair.base, pair.adds);
      const ot = rate(others, pair.base, pair.adds);
      if (me.n < T.pairMinBills || ot.n < T.pairOthersMin) continue;
      const p = (me.y / me.n) * 100, p0 = (ot.y / ot.n) * 100;
      if (p0 - p < T.pairGapPts || binomLowerTail(me.y, me.n, p0 / 100) > T.pairP) continue;
      // ₹ per added item = average selling price of the add-on in this store, last 12 months
      let addRs = 0, addN = 0;
      for (const b of [...x.bills, ...others]) {
        const v = ctx.billValue.get(b.bill_id);
        for (const a of pair.adds) if (v?.byCat.has(a)) { addRs += v.byCat.get(a)!; addN++; }
      }
      const unit = addN ? addRs / addN : 0;
      const per28 = (me.n * 28) / 365;
      const gap = r2(p0 - p);
      const rupees = rupeesFromRate({ gapPts: gap, base: per28, rupeesPerUnit: Math.round(unit) });
      const nm = ctx.name.get(x.sp) ?? x.sp;
      const peer = bestPeer(ctx, by, x, (o) => { const r = rate(o.bills, pair.base, pair.adds); return r.n >= T.pairMinBills ? r.y / r.n : null; });
      const steps = [
        step(`${nm}: ${pair.base} bills with a ${pair.addLabel}, ${ctx.year.label}`, p, fmt.pct(p), `bills with ${pair.base} and ${pair.addLabel} ÷ bills with ${pair.base} × 100`, me.n,
          { label: `Rest of ${x.store}`, value: r2(p0), display: fmt.pct(p0) }),
        step("Pair gap vs the rest of the store", gap, fmt.pts(gap), "store rate − salesperson rate", me.n + ot.n),
        step(`${nm}: ${pair.base} bills per 28 days`, per28, fmt.one(per28), "12-month count × 28 ÷ 365", me.n),
        step(`Average ${pair.addLabel} price`, Math.round(unit), fmt.rupees(unit), "Σ add-on selling value ÷ bills with the add-on", addN),
        step("₹ at stake, next 28 days", rupees, fmt.rupees(rupees), "gap ÷ 100 × bills per 28 days × add-on price", me.n),
      ];
      const cand = issue(ctx, {
        store_id: x.store, lever: "bigger_baskets", type: "missing_pair", rupees, steps, idSuffix: x.sp,
        cause: `${nm} adds a ${pair.addLabel} to ${fmt.pct(p)} of ${pair.base} bills; the rest of ${x.store} does it on ${fmt.pct(p0)}.`,
        action: { who: `${nm}, ${x.store}`, what: pair.show, when: "Today" },
        peer: peer ? { ...peer, why: `Best ${pair.base} pairing in ${x.store}` } : null,
        subject: { salesperson_id: x.sp, display_name: nm },
      });
      if (!best || cand.rupees_at_stake > best.rupees_at_stake) best = cand;
    }
    if (best) out.push(best);
  }
  return out;
}

/** A salesperson avoiding a category their city buys (regional taste respected: compared within the city). */
export function detectCategoryAvoidance(ctx: Ctx): Issue[] {
  const out: Issue[] = [];
  const by = billsBySp(ctx, ctx.year);
  const cityOf = (s: string) => ctx.store.get(s)?.city;
  for (const x of by.values()) {
    if (!ctx.active(x.sp) || !ctx.judged.has(x.store) || x.bills.length < T.catMinBills) continue;
    const city = cityOf(x.store);
    const others = [...by.values()].filter((o) => o.sp !== x.sp && cityOf(o.store) === city).flatMap((o) => o.bills);
    if (!others.length) continue;
    let worst: { cat: string; p: number; p0: number; z: number; y: number } | null = null;
    for (const cat of AVOID_CATS) {
      const y = x.bills.filter((b) => ctx.billCats.get(b.bill_id)?.has(cat)).length;
      const y0 = others.filter((b) => ctx.billCats.get(b.bill_id)?.has(cat)).length;
      const p = (y / x.bills.length) * 100, p0 = (y0 / others.length) * 100;
      const z = zLow(y, x.bills.length, p0 / 100);
      if (p > p0 * T.catShareX || z > -T.catZ) continue;
      if (!worst || z < worst.z) worst = { cat, p, p0, z, y };
    }
    if (!worst) continue;
    const nm = ctx.name.get(x.sp) ?? x.sp;
    let catRs = 0, catN = 0;
    for (const b of others.filter((b) => b.store_id === x.store)) {
      const v = ctx.billValue.get(b.bill_id)?.byCat.get(worst.cat);
      if (v) { catRs += v; catN++; }
    }
    const unit = catN ? catRs / catN : 0;
    const per28 = (x.bills.length * 28) / 365;
    const gap = r2(worst.p0 - worst.p);
    const rupees = rupeesFromRate({ gapPts: gap, base: per28, rupeesPerUnit: Math.round(unit) });
    const peer = bestPeer(ctx, by, x, (o) => (o.bills.length >= 50 ? o.bills.filter((b) => ctx.billCats.get(b.bill_id)?.has(worst!.cat)).length / o.bills.length : null));
    out.push(issue(ctx, {
      store_id: x.store, lever: "bigger_baskets", type: "category_avoidance", rupees, idSuffix: x.sp,
      steps: [
        step(`${nm}: bills with ${worst.cat}, ${ctx.year.label}`, worst.p, fmt.pct(worst.p), `bills with ${worst.cat} ÷ all bills × 100`, x.bills.length,
          { label: `Rest of ${city}`, value: r2(worst.p0), display: fmt.pct(worst.p0) }),
        step("Category gap vs the city", gap, fmt.pts(gap), "city share − salesperson share", x.bills.length + others.length),
        step(`${nm}: bills per 28 days`, per28, fmt.one(per28), "12-month count × 28 ÷ 365", x.bills.length),
        step(`Average ${worst.cat} value per bill in ${x.store}`, Math.round(unit), fmt.rupees(unit), `Σ ${worst.cat} selling value ÷ bills with ${worst.cat}`, catN),
        step("₹ at stake, next 28 days", rupees, fmt.rupees(rupees), "gap ÷ 100 × bills per 28 days × category value", x.bills.length),
      ],
      cause: `${nm} sells ${worst.cat} on ${fmt.pct(worst.p)} of bills; the rest of ${city} sells it on ${fmt.pct(worst.p0)}.`,
      action: { who: `${nm}, ${x.store}`, what: `Show at least one ${worst.cat} option to every customer you serve`, when: "Today" },
      peer: peer ? { ...peer, why: `Sells the most ${worst.cat} in ${x.store}` } : null,
      subject: { salesperson_id: x.sp, display_name: nm },
    }));
  }
  return out;
}

/** Discounts well above the store's norm: one salesperson vs the rest of the same store, recent window. */
export function detectDiscountAboveNorm(ctx: Ctx): Issue[] {
  const out: Issue[] = [];
  const by = billsBySp(ctx, ctx.recent);
  const disc = (bills: BillRow[]) => {
    let mrp = 0, sales = 0, lines = 0;
    for (const b of bills) { const v = ctx.billValue.get(b.bill_id); if (v) { mrp += v.mrp; sales += v.sales; lines += v.lines; } }
    return { pct: mrp ? ((mrp - sales) / mrp) * 100 : 0, mrp, lines };
  };
  const days = dayDiff(ctx.recent.from, ctx.recent.to) + 1;
  for (const x of by.values()) {
    if (!ctx.active(x.sp) || !ctx.judged.has(x.store)) continue;
    const me = disc(x.bills);
    const ot = disc([...by.values()].filter((o) => o.store === x.store && o.sp !== x.sp).flatMap((o) => o.bills));
    if (me.lines < T.discMinLines || ot.lines < T.discMinLines) continue;
    if (me.pct < ot.pct * T.discX || me.pct - ot.pct < T.discGapPts) continue;
    const nm = ctx.name.get(x.sp) ?? x.sp;
    const mrp28 = (me.mrp * 28) / days;
    const gap = r2(me.pct - ot.pct);
    const rupees = rupeesFromRate({ gapPts: gap, base: mrp28, rupeesPerUnit: 1 });
    const peer = bestPeer(ctx, by, x, (o) => { const d = disc(o.bills); return d.lines >= T.discMinLines ? -d.pct : null; });
    out.push(issue(ctx, {
      store_id: x.store, lever: "bigger_baskets", type: "discount_above_norm", rupees, idSuffix: x.sp,
      steps: [
        step(`${nm}: discount off MRP, ${ctx.recent.label}`, me.pct, fmt.pct(me.pct), "Σ (mrp − selling price) × qty ÷ Σ mrp × qty × 100, no packaging", me.lines,
          { label: `Rest of ${x.store}`, value: r2(ot.pct), display: fmt.pct(ot.pct) }),
        step("Discount above the store's norm", gap, fmt.pts(gap), "salesperson − rest of store", me.lines + ot.lines),
        step(`${nm}: MRP value sold per 28 days`, mrp28, fmt.rupees(mrp28), `Σ mrp × qty, ${ctx.recent.label} × 28 ÷ ${days}`, me.lines),
        step("₹ at stake, next 28 days", rupees, fmt.rupees(rupees), "gap ÷ 100 × MRP value per 28 days", me.lines),
      ],
      cause: `${nm} gives ${fmt.pct(me.pct)} off MRP; the rest of ${x.store} gives ${fmt.pct(ot.pct)}.`,
      action: { who: `${nm}, ${x.store}`, what: "Check with the store manager before giving any discount", when: "From today" },
      peer: peer ? { ...peer, why: `Lowest discount in ${x.store}` } : null,
      subject: { salesperson_id: x.sp, display_name: nm },
    }));
  }
  return out;
}

// ---------------------------------------------------------------- More repeat
/** All-time repeat counts: customer attributed to their fleet-wide first bill, 30+ days before as-of. */
function repeatCounts(ctx: Ctx) {
  const first = new Map<string, BillRow>();
  const last = new Map<string, string>();
  for (const b of ctx.in.bills) {
    if (b.bill_date > ctx.asOf) continue;
    const f = first.get(b.customer_id);
    if (!f || b.bill_date < f.bill_date) first.set(b.customer_id, b);
    if ((last.get(b.customer_id) ?? "") < b.bill_date) last.set(b.customer_id, b.bill_date);
  }
  const cutoff = addDays(ctx.asOf, -30);
  const by = new Map<string, { n: number; rep: number; recent: number; store: string }>();
  for (const [c, f] of first) {
    if (f.bill_date > cutoff) continue;
    const x = by.get(f.salesperson_id) ?? by.set(f.salesperson_id, { n: 0, rep: 0, recent: 0, store: f.store_id }).get(f.salesperson_id)!;
    x.n++;
    if (dayDiff(f.bill_date, last.get(c)!) >= 30) x.rep++;
    if (f.bill_date >= ctx.year.from) x.recent++;
  }
  return by;
}

/** Role models whose customers come back, and salespeople whose customers don't — within their own store. */
export function detectRepeat(ctx: Ctx): Issue[] {
  const out: Issue[] = [];
  const by = repeatCounts(ctx);
  const rate = (x: { n: number; rep: number }) => (x.n ? (x.rep / x.n) * 100 : 0);
  const others = (sp: string, store: string) => {
    let n = 0, rep = 0;
    for (const [k, v] of by) if (k !== sp && v.store === store) { n += v.n; rep += v.rep; }
    return { n, rep };
  };
  const role = new Map<string, { sp: string; p: number }>();
  const candidates = [...by].filter(([sp, x]) => ctx.active(sp) && ctx.judged.has(x.store));
  // Same-store colleagues with enough customers to have a fair rate: used to name a peer on every card.
  const rated = candidates.filter(([, x]) => x.n >= T.repMin).map(([sp, x]) => ({ sp, store: x.store, p: rate(x) }));
  const extreme = (store: string, not: string, dir: 1 | -1) =>
    rated.filter((r) => r.store === store && r.sp !== not).sort((a, b) => dir * (b.p - a.p))[0] ?? null;
  const asPeer = (r: { sp: string } | null, why: string) => (r ? { salesperson_id: r.sp, display_name: ctx.name.get(r.sp) ?? r.sp, why } : null);
  for (const [sp, x] of candidates) {
    const o = others(sp, x.store);
    if (x.n < T.repMin || o.n < T.repMin) continue;
    const p = rate(x), p0 = rate(o);
    const z = zLow(x.rep, x.n, p0 / 100);
    if (p < p0 * T.roleX || z < T.roleZ) continue;
    if ((role.get(x.store)?.p ?? -1) < p) role.set(x.store, { sp, p });
    const nm = ctx.name.get(sp) ?? sp;
    out.push(issue(ctx, {
      store_id: x.store, lever: "more_repeat", type: "role_model", rupees: 0, idSuffix: sp,
      steps: [
        step(`${nm}: customers who came back, all time`, p, fmt.pct(p), "customers billing again 30+ days after their first bill ÷ customers × 100", x.n,
          { label: `Rest of ${x.store}`, value: r2(p0), display: fmt.pct(p0) }),
        step(`${nm}: customers counted`, x.n, fmt.int(x.n), "first bills (fleet-wide) made by this salesperson, 30+ days before as-of", x.n),
        step("₹ at stake", 0, fmt.rupees(0), "a role model is upside, not a loss: shown as the peer on low-repeat cards", 0),
      ],
      cause: `${nm}'s customers come back ${fmt.pct(p)} of the time; the rest of ${x.store}: ${fmt.pct(p0)}. A role model to copy.`,
      action: { who: `Store manager, ${x.store}`, what: `Ask ${nm} to show the team how they follow up with customers`, when: "Saturday's morning huddle" },
      peer: asPeer(extreme(x.store, sp, -1), `Lowest repeat rate in ${x.store}: learns most from this role model`),
      subject: { salesperson_id: sp, display_name: nm },
    }));
  }
  for (const [sp, x] of candidates) {
    const o = others(sp, x.store);
    if (x.n < T.lowRepMin || o.n < T.repMin) continue;
    const p = rate(x), p0 = rate(o);
    if (zLow(x.rep, x.n, p0 / 100) > -T.lowRepZ) continue;
    const nm = ctx.name.get(sp) ?? sp;
    const v = tot(ctx, [x.store], ctx.year, () => true, "all");
    const abv = v.bills ? v.sales_value / v.bills : 0;
    const per28 = (x.recent * 28) / 365;
    const gap = r2(p0 - p);
    const rupees = rupeesFromRate({ gapPts: gap, base: per28, rupeesPerUnit: Math.round(abv) });
    const rm = role.get(x.store);
    out.push(issue(ctx, {
      store_id: x.store, lever: "more_repeat", type: "low_repeat", rupees, idSuffix: sp,
      steps: [
        step(`${nm}: customers who came back, all time`, p, fmt.pct(p), "customers billing again 30+ days after their first bill ÷ customers × 100", x.n,
          { label: `Rest of ${x.store}`, value: r2(p0), display: fmt.pct(p0) }),
        step("Repeat gap vs the rest of the store", gap, fmt.pts(gap), "store rate − salesperson rate", x.n + o.n),
        step(`${nm}: new customers per 28 days`, per28, fmt.one(per28), "first bills in the last 12 months × 28 ÷ 365", x.recent),
        step(`Average bill value in ${x.store}, ${ctx.year.label}`, Math.round(abv), fmt.rupees(abv), "Σ qty × selling price ÷ bills", v.bills),
        step("₹ at stake, next 28 days", rupees, fmt.rupees(rupees), "gap ÷ 100 × new customers per 28 days × average bill value", x.n),
      ],
      cause: `Only ${fmt.pct(p)} of ${nm}'s customers come back; the rest of ${x.store}: ${fmt.pct(p0)}.`,
      action: { who: `${nm}, ${x.store}`, what: "Take the phone number on every bill and send a thank-you message the same evening", when: "From today" },
      peer: rm && rm.sp !== sp
        ? asPeer(rm, `Role model for repeat customers in ${x.store}`)
        : asPeer(extreme(x.store, sp, 1), `Best repeat rate in ${x.store}`),
      subject: { salesperson_id: sp, display_name: nm },
    }));
  }
  return out;
}

// ---------------------------------------------------------------- helpers
function pick(p: { salesperson_id: string; display_name: string }) {
  return { salesperson_id: p.salesperson_id, display_name: p.display_name };
}

function bestPeer(ctx: Ctx, by: Map<string, SpBills>, x: SpBills, score: (o: SpBills) => number | null) {
  let best: { salesperson_id: string; display_name: string; s: number } | null = null;
  for (const o of by.values()) {
    if (o.store !== x.store || o.sp === x.sp || !ctx.active(o.sp)) continue;
    const s = score(o);
    if (s !== null && (!best || s > best.s)) best = { salesperson_id: o.sp, display_name: ctx.name.get(o.sp) ?? o.sp, s };
  }
  return best ? pick(best) : null;
}

function billShare(ctx: Ctx, storeId: string, sp: string, w: { from: string; to: string }) {
  const n = new Map<string, number>();
  for (const b of ctx.in.bills) if (b.store_id === storeId && inRange(b.bill_date, w.from, w.to)) n.set(b.salesperson_id, (n.get(b.salesperson_id) ?? 0) + 1);
  const total = [...n.values()].reduce((a, b) => a + b, 0);
  if (!total || !n.has(sp)) return null;
  const ranked = [...n].sort((a, b) => b[1] - a[1]);
  return { share: (n.get(sp)! / total) * 100, rank: ranked.findIndex(([k]) => k === sp) + 1, sellers: n.size, storeBills: total };
}

const isWeekendDate = (d: string) => { const w = new Date(`${d}T00:00:00Z`).getUTCDay(); return w === 0 || w === 6; };

function presenceOf(ctx: Ctx, f: (r: RosterRow) => boolean) {
  const calc = (w: Win) => {
    const rows = ctx.in.roster.filter((r) => inRange(r.date, w.from, w.to) && f(r));
    return rows.length >= 8 ? { p: (rows.filter((r) => r.status === "Present").length / rows.length) * 100, n: rows.length } : null;
  };
  const b = calc(ctx.base), r = calc(ctx.recent);
  return { base: b?.p ?? null, recent: r?.p ?? null, rows: r?.n ?? 0 };
}

// ---------------------------------------------------------------- run all
const CONV_PRIORITY: IssueType[] = ["understaffed_busy_days", "staff_absent_or_left", "conversion_drop_footfall_steady"];

/** One conversion issue per store (the most specific cause wins), so ₹ is never counted twice. */
function dedupeConversion(issues: Issue[]): Issue[] {
  const keep = new Map<string, Issue>();
  const rest: Issue[] = [];
  for (const i of issues) {
    if (!CONV_PRIORITY.includes(i.type)) { rest.push(i); continue; }
    const cur = keep.get(i.store_id);
    const better = !cur || CONV_PRIORITY.indexOf(i.type) < CONV_PRIORITY.indexOf(cur.type) ||
      (i.type === cur.type && i.rupees_at_stake > cur.rupees_at_stake);
    if (better) keep.set(i.store_id, i);
  }
  return [...keep.values(), ...rest];
}

/** Ranks by ₹ within each area manager (1 = biggest). Market notes (city_slowdown) rank after the alerts. */
export function rankIssues(issues: Issue[]): Issue[] {
  const out: Issue[] = [];
  for (const am of [...new Set(issues.map((i) => i.area_manager_id))].sort()) {
    const mine = issues.filter((i) => i.area_manager_id === am);
    const alerts = mine.filter((i) => i.type !== "city_slowdown").sort((a, b) => b.rupees_at_stake - a.rupees_at_stake || a.id.localeCompare(b.id));
    const notes = mine.filter((i) => i.type === "city_slowdown");
    [...alerts, ...notes].forEach((i, k) => out.push({ ...i, rank: k + 1 }));
  }
  return out;
}

/** The area-manager brief: at most n alerts each, ranked by ₹. Market notes are not alerts. */
export function amTop(ranked: Issue[], n = 5): Record<string, Issue[]> {
  const out: Record<string, Issue[]> = {};
  for (const i of ranked) {
    if (i.type === "city_slowdown") continue;
    (out[i.area_manager_id] ??= []).push(i);
  }
  for (const k of Object.keys(out)) out[k] = out[k].sort((a, b) => a.rank - b.rank).slice(0, n);
  return out;
}

export function detectAll(input: DetectInput): { issues: Issue[]; ctx: Ctx } {
  const ctx = buildContext(input);
  const conv = dedupeConversion([...detectUnderstaffedBusyDays(ctx), ...detectStaffAbsentOrLeft(ctx), ...detectConversionDrop(ctx)]);
  const city = detectCitySlowdown(ctx);
  // A city-wide slowdown explains its stores: no store conversion alerts there.
  const slowCities = new Set(city.map((c) => ctx.store.get(c.store_id)!.city));
  const issues = [
    ...conv.filter((i) => !slowCities.has(ctx.store.get(i.store_id)!.city)),
    ...city,
    ...detectMissingPair(ctx),
    ...detectCategoryAvoidance(ctx),
    ...detectDiscountAboveNorm(ctx),
    ...detectRepeat(ctx),
  ];
  return { issues: rankIssues(issues), ctx };
}

/** Why a named lead holds or not (used by the loader to record dropped leads). Aggregates only. */
export function explainConversion(ctx: Ctx, storeId: string) {
  const c = convCheck(ctx, storeId, ctx.base, ctx.recent);
  return c && { before: r2(c.store.before), after: r2(c.store.after), gap: r2(c.gap), z: r2(c.z), city: c.city, state: c.state, holds: fails(c) };
}
