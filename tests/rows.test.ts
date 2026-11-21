import { test } from "node:test";
import assert from "node:assert/strict";
import { repeatRate, pairAttach, storeMetricsRows } from "../engine/rows";
import type { BillRow, BillLineRow, FootfallRow, ItemRow, RosterRow } from "../engine/metrics";

const bill = (bill_id: string, bill_date: string, customer_id: string, store_id = "S-1", salesperson_id = "SP1"): BillRow =>
  ({ bill_id, bill_date, store_id, salesperson_id, customer_id });

test("repeatRate: share of customers first billed in window who bill again 30+ days later", () => {
  const bills = [
    bill("B1", "2026-05-01", "C1"), bill("B2", "2026-06-15", "C1"), // repeat (45 days)
    bill("B3", "2026-05-01", "C2"), bill("B4", "2026-05-20", "C2"), // 19 days only: not a repeat
    bill("B5", "2026-05-10", "C3"),                                 // never back
    bill("B6", "2026-04-01", "C4"), bill("B7", "2026-05-15", "C4"), // first bill before window: not counted
  ];
  const r = repeatRate(bills, { from: "2026-05-01", to: "2026-07-31", asOf: "2026-10-31", minCustomers: 1, groupBy: (b) => b.store_id });
  assert.equal(r.get("S-1")!.toFixed(2), "33.33");
});

test("repeatRate is null-free: groups under minCustomers are left out", () => {
  const r = repeatRate([bill("B1", "2026-05-01", "C1")], { from: "2026-05-01", to: "2026-07-31", asOf: "2026-10-31", minCustomers: 30, groupBy: (b) => b.store_id });
  assert.equal(r.has("S-1"), false);
});

const items: ItemRow[] = [
  { sku_id: "SHW-1", category: "Sherwani", mrp: 20000, is_packaging: false },
  { sku_id: "SAF-1", category: "Safa", mrp: 2000, is_packaging: false },
  { sku_id: "KUR-1", category: "Kurta Set", mrp: 5000, is_packaging: false },
  { sku_id: "JKT-1", category: "Jacket", mrp: 4000, is_packaging: false },
];

test("pairAttach: % of sherwani bills with safa/mojari/mala and kurta bills with a jacket", () => {
  const bills = [bill("B1", "2026-10-01", "C1"), bill("B2", "2026-10-01", "C2"), bill("B3", "2026-10-01", "C3")];
  const lines: BillLineRow[] = [
    { bill_id: "B1", sku_id: "SHW-1", qty: 1, mrp: 20000, selling_price: 20000 },
    { bill_id: "B1", sku_id: "SAF-1", qty: 1, mrp: 2000, selling_price: 2000 },
    { bill_id: "B2", sku_id: "SHW-1", qty: 1, mrp: 20000, selling_price: 20000 },
    { bill_id: "B3", sku_id: "KUR-1", qty: 1, mrp: 5000, selling_price: 5000 },
  ];
  const r = pairAttach(bills, lines, items, (b) => b.salesperson_id).get("SP1")!;
  assert.deepEqual(r, { sherwani: 50, sherwaniBills: 2, kurta: 0, kurtaBills: 1 });
});

test("storeMetricsRows skips windows with no data instead of writing NaN", () => {
  const footfall: FootfallRow[] = [{ date: "2026-10-20", store_id: "NEW-1", footfall: 10 }];
  const roster: RosterRow[] = [];
  const rows = storeMetricsRows({
    asOf: "2026-10-31",
    stores: [{ store_id: "NEW-1", city: "A", state: "X", opened_on: "2026-10-10" }],
    bills: [bill("B1", "2026-10-20", "C1", "NEW-1")],
    lines: [{ bill_id: "B1", sku_id: "KUR-1", qty: 2, mrp: 5000, selling_price: 4500 }],
    items, footfall, roster,
  });
  assert.deepEqual(rows.map((r) => r.window).sort(), ["all_time", "current_28d"]);
  const cur = rows.find((r) => r.window === "current_28d")!;
  assert.equal(cur.conversion, 10);
  assert.equal(cur.ipb, 2);
  assert.equal(cur.avg_bill_value, 9000);
  for (const v of Object.values(cur)) if (typeof v === "number") assert.ok(Number.isFinite(v));
});

test("salespersonMetricsRows: inferred_left follows the roster, never bills", async () => {
  const { salespersonMetricsRows } = await import("../engine/rows");
  const roster: RosterRow[] = [];
  for (let d = 1; d <= 31; d++) {
    const date = `2026-10-${String(d).padStart(2, "0")}`;
    roster.push({ date, store_id: "S-1", salesperson_id: "QUIET", status: "Present" }); // on roster, no sales
    if (d <= 5) roster.push({ date, store_id: "S-1", salesperson_id: "GONE", status: "Present" }); // roster stops 5 Oct
  }
  const rows = salespersonMetricsRows({
    asOf: "2026-10-31",
    stores: [{ store_id: "S-1", city: "A", state: "X", opened_on: "2020-01-01" }],
    salespeople: [{ salesperson_id: "QUIET", store_id: "S-1", name: "Q." }, { salesperson_id: "GONE", store_id: "S-1", name: "G." }],
    bills: [bill("B1", "2026-10-30", "C1", "S-1", "GONE")], // a late bill must not make GONE "still here"
    lines: [], items, footfall: [], roster,
  });
  const by = new Map(rows.map((r) => [r.salesperson_id, r]));
  assert.equal(by.get("QUIET")!.inferred_left, false);
  assert.equal(by.get("GONE")!.inferred_left, true);
});
