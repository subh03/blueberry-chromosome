import { test } from "node:test";
import assert from "node:assert/strict";
import { basketFlag, estConversion, round100, standingVsPeers, storeCompareRows, teamRows, vsStore, type TeamInput } from "../engine/team";
import type { TeamRow } from "../types";

test("estConversion: bills ÷ Σ(store walk-ins that day ÷ people present that day) × 100", () => {
  const presentDays = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"].map((date) => ({ store_id: "S", date }));
  const footfall = new Map(presentDays.map((p, i) => [`S|${p.date}`, i % 2 ? 100 : 40]));
  const presentCount = new Map(presentDays.map((p, i) => [`S|${p.date}`, i % 2 ? 4 : 2]));
  // shares: 20 + 25 + 20 + 25 + 20 = 110 walk-ins; 11 bills -> 10%
  assert.equal(estConversion({ bills: 11, presentDays, footfall, presentCount }), 10);
  assert.equal(estConversion({ bills: 11, presentDays: presentDays.slice(0, 4), footfall, presentCount }), null); // < 5 present days
});

const row = (id: string, o: Partial<TeamRow> = {}): Omit<TeamRow, "vs_store"> => ({
  salesperson_id: id, store_id: "S", display_name: id, days_rostered: 20, days_present: 16, presence: 80, bills: 30,
  est_conversion: 12, ipb: 1.8, repeat_rate: null, on_roster: true, ...o,
});

test("vsStore: compares with the median of the REST of the store, by each metric's bar", () => {
  const out = vsStore([
    row("A", { presence: 70, est_conversion: 14, ipb: 1.6 }),
    row("B", { presence: 80, est_conversion: 12, ipb: 1.8 }),
    row("C", { presence: 90, est_conversion: 10, ipb: 2.0 }),
    row("D", { presence: 82, est_conversion: null, ipb: 1.9 }),
  ]);
  const a = out.find((r) => r.salesperson_id === "A")!.vs_store;
  // rest of A: presence 80/90/82 -> median 82; est_conv 12/10 -> 11; ipb 1.8/2.0/1.9 -> 1.9
  assert.deepEqual(a, { presence: "below", est_conversion: "above", ipb: "below", repeat_rate: null });
  const b = out.find((r) => r.salesperson_id === "B")!.vs_store;
  // rest of B: presence 70/90/82 -> 82 (gap 2 < 5); est_conv 14/10 -> 12 (same); ipb 1.6/2.0/1.9 -> 1.9 (gap 0.1 < 0.15)
  assert.deepEqual(b, { presence: "same", est_conversion: "same", ipb: "same", repeat_rate: null });
  assert.equal(out.find((r) => r.salesperson_id === "D")!.vs_store.est_conversion, null);
});

test("standingVsPeers: below/above only against BOTH peers", () => {
  assert.equal(standingVsPeers(10, 12, 11.5, 1), "below");
  assert.equal(standingVsPeers(10, 12, 10.5, 1), "same");
  assert.equal(standingVsPeers(14, 12, 12.9, 1), "above");
  assert.equal(standingVsPeers(10, null, null, 1), null);
});

test("basketFlag: only when below both peers by 0.10 AND own baseline by 0.05", () => {
  const base = { bills: 200, avgItemValue: 5000.4 };
  assert.equal(basketFlag({ now: 1.7, baseline: 1.9, city: 1.85, state: 1.75, ...base }), null); // state gap 0.05
  assert.equal(basketFlag({ now: 1.7, baseline: 1.72, city: 1.85, state: 1.84, ...base }), null); // baseline gap 0.02
  const f = basketFlag({ now: 1.69, baseline: 1.9, city: 1.85, state: 1.84, ...base })!;
  assert.equal(f.gap_vs_peers, 0.15);
  assert.equal(f.avg_item_value, 5000);
  assert.equal(f.rupees, 150000); // 0.15 × 200 × 5000
  assert.equal(f.display, "1.69 items per bill vs 1.85 city / 1.84 state peers");
  const g = basketFlag({ now: 1.69, baseline: 1.9, city: 1.85, state: 1.84, bills: 37, avgItemValue: 4321 })!;
  assert.equal(g.rupees, 24000); // 0.15 × 37 × 4321 = 23,981.55 -> nearest ₹100
});

test("round100 rounds to the nearest ₹100 and never goes negative", () => {
  assert.equal(round100(23981.55), 24000);
  assert.equal(round100(149), 100);
  assert.equal(round100(150), 200);
  assert.equal(round100(-500), 0);
});

test("storeCompareRows + teamRows on a tiny fixture: no NaN, new store not judged", () => {
  const dates = Array.from({ length: 28 }, (_, i) => `2026-10-${String(i + 4).padStart(2, "0")}`);
  const input: TeamInput = {
    asOf: "2026-10-31",
    stores: [
      { store_id: "A-1", city: "C", state: "X", opened_on: "2020-01-01", area_manager_id: "AM-01" },
      { store_id: "A-2", city: "C", state: "X", opened_on: "2020-01-01", area_manager_id: "AM-01" },
      { store_id: "N-1", city: "C", state: "X", opened_on: "2026-09-01", area_manager_id: "AM-01" },
    ],
    items: [{ sku_id: "K", category: "Kurta Set", mrp: 5000, is_packaging: false }, { sku_id: "BAG", category: "Bag", mrp: 0, is_packaging: true }],
    footfall: dates.flatMap((date) => ["A-1", "A-2", "N-1"].map((store_id) => ({ date, store_id, footfall: 20 }))),
    roster: dates.flatMap((date) => [
      { date, store_id: "A-1", salesperson_id: "SP1", status: "Present" },
      { date, store_id: "A-1", salesperson_id: "SP2", status: "Present" },
    ]),
    bills: dates.flatMap((date, i) => [
      { bill_id: `B${i}a`, bill_date: date, store_id: "A-1", salesperson_id: "SP1", customer_id: `C${i}a` },
      { bill_id: `B${i}b`, bill_date: date, store_id: "A-2", salesperson_id: "SP3", customer_id: `C${i}b` },
    ]),
    lines: dates.flatMap((_, i) => [
      { bill_id: `B${i}a`, sku_id: "K", qty: 2, mrp: 5000, selling_price: 5000 },
      { bill_id: `B${i}a`, sku_id: "BAG", qty: 1, mrp: 0, selling_price: 0 },
      { bill_id: `B${i}b`, sku_id: "K", qty: 1, mrp: 5000, selling_price: 5000 },
    ]),
    salespeople: [{ salesperson_id: "SP1", store_id: "A-1", name: "A B." }, { salesperson_id: "SP2", store_id: "A-1", name: "C D." }],
    calendar: [],
  };
  const s = storeCompareRows(input);
  const a1 = s.find((x) => x.store_id === "A-1")!;
  assert.equal(a1.conversion.now, 5); // 28 bills ÷ 560 walk-ins
  assert.equal(a1.ipb.now, 2); // packaging left out
  assert.equal(a1.ipb.city_peers, 1);
  assert.equal(s.find((x) => x.store_id === "N-1")!.conversion.vs_peers, null);
  const t = teamRows(input);
  const sp1 = t.find((r) => r.salesperson_id === "SP1")!;
  assert.equal(sp1.est_conversion, 10); // 28 bills ÷ (28 × 20 ÷ 2) × 100
  assert.equal(sp1.ipb, 2);
  assert.equal(sp1.presence, 100);
  const json = JSON.stringify({ s, t });
  assert.ok(!/NaN|Infinity/.test(json));
});
