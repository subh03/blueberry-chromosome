import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildStoreDays,
  sumDays,
  conversion,
  itemsPerBill,
  discountPct,
  type BillRow,
  type BillLineRow,
  type FootfallRow,
  type ItemRow,
} from "../engine/metrics";

// Tiny synthetic fixture (no real data): 2 stores, 2 days.
const items: ItemRow[] = [
  { sku_id: "KUR-01-L", category: "Kurta Set", mrp: 1000, is_packaging: false },
  { sku_id: "MOJ-01-9", category: "Mojari", mrp: 500, is_packaging: false },
  { sku_id: "PKG-BAG", category: "Packaging", mrp: 0, is_packaging: true },
];
const bills: BillRow[] = [
  { bill_id: "B1", bill_date: "2026-10-01", store_id: "S-1", salesperson_id: "SP1", customer_id: "C1" },
  { bill_id: "B2", bill_date: "2026-10-01", store_id: "S-1", salesperson_id: "SP1", customer_id: "C2" },
  { bill_id: "B3", bill_date: "2026-10-02", store_id: "S-2", salesperson_id: "SP2", customer_id: "C3" },
  // a bill with only a packaging line still counts as a bill
  { bill_id: "B4", bill_date: "2026-10-02", store_id: "S-2", salesperson_id: "SP2", customer_id: "C4" },
];
const lines: BillLineRow[] = [
  { bill_id: "B1", sku_id: "KUR-01-L", qty: 2, mrp: 1000, selling_price: 900 },
  { bill_id: "B1", sku_id: "PKG-BAG", qty: 3, mrp: 0, selling_price: 0 },
  { bill_id: "B2", sku_id: "MOJ-01-9", qty: 1, mrp: 500, selling_price: 500 },
  { bill_id: "B3", sku_id: "KUR-01-L", qty: 1, mrp: 1000, selling_price: 1000 },
  { bill_id: "B3", sku_id: "MOJ-01-9", qty: 1, mrp: 500, selling_price: 500 },
  { bill_id: "B4", sku_id: "PKG-BAG", qty: 1, mrp: 0, selling_price: 0 },
];
const footfall: FootfallRow[] = [
  { date: "2026-10-01", store_id: "S-1", footfall: 20 },
  { date: "2026-10-02", store_id: "S-2", footfall: 30 },
];

const days = buildStoreDays({ bills, lines, items, footfall });
const fleet = sumDays(days);

test("fleet conversion = all bills / all walk-ins x 100", () => {
  // 4 bills / 50 walk-ins = 8%
  assert.equal(conversion(fleet), 8);
});

test("items per bill excludes packaging qty but divides by all bills", () => {
  // non-packaging qty: 2 + 1 + 1 + 1 = 5; bills = 4 (B4 is packaging-only)
  assert.equal(itemsPerBill(fleet), 1.25);
});

test("discount % = sum((mrp - sp) x qty) / sum(mrp x qty) x 100, non-packaging", () => {
  // discount = 100*2 = 200; mrp value = 2000 + 500 + 1000 + 500 = 4000 → 5%
  assert.equal(discountPct(fleet), 5);
});
