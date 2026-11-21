// npm run check:baseline — PLAN.md §4 hour-1 check. Prints aggregates only (no names, phones, customer IDs).
import { loadDataset } from "../engine/data";
import { buildStoreDays, conversion, itemsPerBill, presencePct, sumDays, inRange, type StoreDay } from "../engine/metrics";
import { compareWindows, snapshot, type Comparison, type Window } from "../engine/compare";
import { addDays, badConversionDays, billsExceedFootfall, newStores, rosterLeavers } from "../engine/dq";

const AS_OF = "2026-10-31";
const BEFORE: Window = { from: "2026-05-01", to: "2026-07-31" };
const AFTER: Window = { from: "2026-08-01", to: "2026-10-31" };
const EXPECT = { conversion: 12.95, ipb: 1.96 };
// Flag thresholds (store change minus peer change, both city and state peers must agree)
const T = { conversion: -1.0, ipb: -0.15, presence: -2.0, discount: 0.5 };

const ds = loadDataset();
const allDays = buildStoreDays(ds);
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(34)} ${detail}`);
};
const f = (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : "n/a");
const sign = (n: number, d = 2) => (n >= 0 ? "+" : "") + f(n, d);

// ---------- 1. Fleet numbers ----------
console.log(`\n== Fleet (all time, ${ds.bills.length} bills, ${ds.lines.length} lines, ${ds.footfall.length} store-days of footfall)`);
const fleet = sumDays(allDays);
const conv = conversion(fleet);
const ipb = itemsPerBill(fleet);
check("Conversion = bills / walk-ins", f(conv) === f(EXPECT.conversion), `${f(conv)}% (expected ${EXPECT.conversion}%)`);
check("Items per bill (no packaging)", f(ipb) === f(EXPECT.ipb), `${f(ipb)} (expected ${EXPECT.ipb})`);

// ---------- 2. Store comparison May-Jul vs Aug-Oct ----------
// Conversion uses clean days only (bills > walk-ins days are a data issue).
const bad = badConversionDays(allDays);
const cleanDays: StoreDay[] = allDays.map((d) => (bad.has(`${d.store_id}|${d.date}`) ? { ...d, footfall: 0, bills: 0 } : d));
const tooNew = new Set(newStores(ds.stores, BEFORE.from).map((s) => s.store_id));

function presenceFor(ids: string[], w: Window) {
  const set = new Set(ids);
  return presencePct(ds.roster.filter((r) => set.has(r.store_id) && inRange(r.date, w.from, w.to)));
}
interface Row { c: Comparison; pres: { store: [number, number]; city: [number, number]; state: [number, number] }; reasons: string[] }
const rows: Row[] = [];
for (const s of ds.stores) {
  if (tooNew.has(s.store_id)) continue;
  // conversion from clean days, IPB/discount from all days (bill rows are fine on those days)
  const cConv = compareWindows(cleanDays, ds.stores, s.store_id, BEFORE, AFTER);
  const c = compareWindows(allDays, ds.stores, s.store_id, BEFORE, AFTER);
  for (const k of ["store", "city", "state"] as const) {
    c[k].before.conversion = cConv[k].before.conversion;
    c[k].after.conversion = cConv[k].after.conversion;
    c[k].change.conversion = cConv[k].change.conversion;
  }
  c.gapVsCity.conversion = cConv.gapVsCity.conversion;
  c.gapVsState.conversion = cConv.gapVsState.conversion;

  const pair = (ids: string[]): [number, number] => [presenceFor(ids, BEFORE), presenceFor(ids, AFTER)];
  const pres = { store: pair([s.store_id]), city: pair(c.cityPeers), state: pair(c.statePeers) };
  const pChange = (p: [number, number]) => p[1] - p[0];

  const reasons: string[] = [];
  const both = (city: number, state: number, cmp: (x: number) => boolean) => cmp(city) && cmp(state);
  if (both(c.gapVsCity.conversion, c.gapVsState.conversion, (x) => x <= T.conversion)) reasons.push("conversion");
  if (both(c.gapVsCity.ipb, c.gapVsState.ipb, (x) => x <= T.ipb)) reasons.push("ipb");
  const pg = pChange(pres.store);
  if (both(pg - pChange(pres.city), pg - pChange(pres.state), (x) => x <= T.presence)) reasons.push("presence");
  if (both(c.gapVsCity.discount_pct, c.gapVsState.discount_pct, (x) => x >= T.discount)) reasons.push("discount");
  rows.push({ c, pres, reasons });
}

console.log(`\n== Stores: May-Jul vs Aug-Oct 2026 (conv %, IPB, discount %, presence %). Δ vs = store change minus peer change`);
console.log("store    conv before→after  Δvs city/state   IPB before→after  Δvs city/state   disc before→after  presence before→after  flags");
for (const { c, pres, reasons } of rows) {
  const s = c.store;
  console.log(
    `${c.store_id.padEnd(8)} ${f(s.before.conversion)}→${f(s.after.conversion)}`.padEnd(27) +
      `${sign(c.gapVsCity.conversion)}/${sign(c.gapVsState.conversion)}`.padEnd(17) +
      `${f(s.before.ipb)}→${f(s.after.ipb)}`.padEnd(18) +
      `${sign(c.gapVsCity.ipb)}/${sign(c.gapVsState.ipb)}`.padEnd(17) +
      `${f(s.before.discount_pct, 1)}→${f(s.after.discount_pct, 1)}`.padEnd(19) +
      `${f(pres.store[0], 1)}→${f(pres.store[1], 1)}`.padEnd(23) +
      (reasons.length ? `⚑ ${reasons.join(", ")}` : ""),
  );
}
const flagged = new Map(rows.map((r) => [r.c.store_id, r]));

function detail(id: string) {
  const r = flagged.get(id)!;
  const { c, pres } = r;
  const line = (label: string, k: "conversion" | "ipb" | "discount_pct", d = 2) =>
    `  ${label.padEnd(10)} store ${f(c.store.before[k], d)}→${f(c.store.after[k], d)} | city peers (${c.cityPeers.join(",")}) ${f(c.city.before[k], d)}→${f(c.city.after[k], d)} | state peers ${f(c.state.before[k], d)}→${f(c.state.after[k], d)}`;
  console.log(line("conversion", "conversion"));
  console.log(line("IPB", "ipb"));
  console.log(line("discount%", "discount_pct", 1));
  console.log(`  presence   store ${f(pres.store[0], 1)}→${f(pres.store[1], 1)} | city peers ${f(pres.city[0], 1)}→${f(pres.city[1], 1)} | state peers ${f(pres.state[0], 1)}→${f(pres.state[1], 1)}`);
  return r;
}

console.log("\n== Hour-1 targets");
for (const id of ["LKO-02", "BLR-03"]) {
  console.log(`${id}:`);
  const r = detail(id);
  check(`${id} flagged vs peers`, r.reasons.length > 0, r.reasons.length ? `on ${r.reasons.join(", ")}` : "not flagged");
}

// ---------- 3. Data quality ----------
console.log("\n== Data quality (flags, never alerts)");
const pkgSkus = new Set(ds.items.filter((i) => i.is_packaging).map((i) => i.sku_id));
const pkgLines = ds.lines.filter((l) => pkgSkus.has(l.sku_id)).length;
console.log(`  packaging_rows          ${pkgLines} bill lines (${ds.items.filter((i) => i.is_packaging).length} packaging SKUs) excluded from IPB/discount`);
const bef = billsExceedFootfall(allDays);
console.log(`  bills_exceed_footfall   ${bef.reduce((a, b) => a + b.days, 0)} store-days: ${bef.map((b) => `${b.store_id} ${b.days}d`).join(", ")}`);
const noFootfall = allDays.filter((d) => d.bills > 0 && d.footfall === 0).length;
console.log(`                          (of which ${noFootfall} store-days have bills but zero/missing footfall)`);
for (const s of newStores(ds.stores, BEFORE.from)) {
  const d = allDays.filter((x) => x.store_id === s.store_id);
  const t = sumDays(d);
  console.log(`  new_store_no_baseline   ${s.store_id} opened ${s.opened_on}: ${d.length} days, ${t.bills} bills, conv ${f(conversion(t))}% — too new to judge, excluded from peers`);
}
// Roster only. Bills are never used: Manyavar mentors say no sale for 3 weeks is normal.
const lv = rosterLeavers({ asOf: AS_OF, minGapDays: 21, salespeople: ds.salespeople.map((s) => s.salesperson_id), roster: ds.roster });
const spStore = new Map(ds.salespeople.map((s) => [s.salesperson_id, s.store_id]));
const countByStore = (ids: string[]) => {
  const m = new Map<string, number>();
  for (const id of ids) m.set(spStore.get(id)!, (m.get(spStore.get(id)!) ?? 0) + 1);
  return [...m].sort(([a], [b]) => a.localeCompare(b)).map(([s, n]) => `${s} ${n}`).join(", ") || "none";
};
console.log(`  staff_no_exit_date      ${ds.salespeople.length} staff, no exit dates. Left (dropped off roster 21+ days before ${AS_OF}): ${lv.left.length} (${countByStore(lv.left.map((l) => l.salesperson_id))})`);
console.log(`                          Absent (on roster, no Present day for 21+ days): ${lv.absent.length} (${countByStore(lv.absent.map((a) => a.salesperson_id))})`);
console.log(`                          Not on roster at all (left before May 2026): ${lv.notOnRoster.length}`);

const diwali = ds.calendar.filter((c) => c.festival === "Diwali" && c.date <= AS_OF).map((c) => c.date);
for (const dd of [...new Set(diwali)]) {
  const win = (from: string, to: string) => snapshot(allDays.filter((d) => inRange(d.date, from, to)));
  const fest = win(addDays(dd, -3), addDays(dd, 3));
  const prior = win(addDays(dd, -24), addDays(dd, -4));
  if (prior.footfall === 0) {
    console.log(`  festival_dip            Diwali ${dd}: no prior data (start of dataset), skipped`);
    continue;
  }
  const perDay = (s: { footfall: number; bills: number }, n: number) => [s.footfall / n, s.bills / n];
  const [ff, fb] = perDay(fest, 7);
  const [pf, pb] = perDay(prior, 21);
  console.log(
    `  festival_dip            Diwali ${dd} ±3d vs prior 3 weeks (fleet/day): footfall ${f(pf, 0)}→${f(ff, 0)} (${sign(((ff - pf) / pf) * 100, 0)}%), bills ${f(pb, 0)}→${f(fb, 0)} (${sign(((fb - pb) / pb) * 100, 0)}%), conv ${f(prior.conversion)}→${f(fest.conversion)}%. Excluded from baselines.`,
  );
}

// ---------- 4. Extra leads ----------
console.log("\n== Extra leads (hold up only if worse than BOTH city and state peers by the flag threshold)");
const lead = (id: string, k: "discount_pct" | "conversion", label: string) => {
  const r = flagged.get(id)!;
  const c = r.c;
  const d = k === "discount_pct" ? 1 : 2;
  const holds = k === "discount_pct" ? r.reasons.includes("discount") : r.reasons.includes("conversion");
  console.log(
    `  ${id} ${label}: store ${f(c.store.before[k], d)}→${f(c.store.after[k], d)}, city peers ${f(c.city.before[k], d)}→${f(c.city.after[k], d)}, state peers ${f(c.state.before[k], d)}→${f(c.state.after[k], d)}; gap vs city ${sign(c.gapVsCity[k], d)}, vs state ${sign(c.gapVsState[k], d)} → ${holds ? "HOLDS" : "DROP"}`,
  );
};
lead("KNP-03", "discount_pct", "discount %");
lead("PAT-01", "discount_pct", "discount %");
lead("MYS-02", "conversion", "conversion %");

console.log(`\n${failures === 0 ? "ALL CHECKS PASS" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
