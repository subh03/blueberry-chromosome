import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../engine/csv";
import { compareWindows, type StoreInfo } from "../engine/compare";
import { billsExceedFootfall, newStores, rosterLeavers } from "../engine/dq";
import type { StoreDay } from "../engine/metrics";

test("parseCsv keeps IDs as text and handles quoted commas", () => {
  const rows = parseCsv('id,stores,n\nAM-01,"LKO-01, LKO-02",007\n');
  assert.deepEqual(rows, [{ id: "AM-01", stores: "LKO-01, LKO-02", n: "007" }]);
});

const day = (store_id: string, date: string, footfall: number, bills: number, items = bills * 2): StoreDay => ({
  store_id, date, footfall, bills, items, mrp_value: 0, sales_value: 0, packaging_lines: 0,
});

const stores: StoreInfo[] = [
  { store_id: "A-1", city: "A", state: "X", opened_on: "2020-01-01" },
  { store_id: "A-2", city: "A", state: "X", opened_on: "2020-01-01" },
  { store_id: "B-1", city: "B", state: "X", opened_on: "2020-01-01" },
];

test("compareWindows gives store vs city peers vs state peers, before and after", () => {
  const days = [
    day("A-1", "2026-06-01", 100, 20), day("A-1", "2026-09-01", 100, 10),
    day("A-2", "2026-06-01", 100, 20), day("A-2", "2026-09-01", 100, 20),
    day("B-1", "2026-06-01", 100, 10), day("B-1", "2026-09-01", 100, 10),
  ];
  const r = compareWindows(days, stores, "A-1", { from: "2026-05-01", to: "2026-07-31" }, { from: "2026-08-01", to: "2026-10-31" });
  assert.equal(r.store.before.conversion, 20);
  assert.equal(r.store.after.conversion, 10);
  assert.equal(r.city.after.conversion, 20); // A-2 only, never itself
  assert.equal(r.state.after.conversion, 15); // A-2 + B-1 pooled
  assert.equal(r.gapVsCity.conversion, -10); // store change (-10) minus city change (0)
});

test("billsExceedFootfall counts store-days where bills > walk-ins", () => {
  const flags = billsExceedFootfall([day("A-1", "2026-06-01", 5, 9), day("A-1", "2026-06-02", 50, 9), day("A-2", "2026-06-01", 5, 6)]);
  assert.deepEqual(flags, [{ store_id: "A-1", days: 1 }, { store_id: "A-2", days: 1 }]);
});

test("newStores flags stores opened after the baseline start", () => {
  const s = [...stores, { store_id: "A-9", city: "A", state: "X", opened_on: "2026-10-10" }];
  assert.deepEqual(newStores(s, "2026-05-01").map((x) => x.store_id), ["A-9"]);
});

test("rosterLeavers: left = roster rows stop; Off rows = absent; bills never count", () => {
  const out = rosterLeavers({
    asOf: "2026-10-31",
    minGapDays: 21,
    salespeople: ["SP1", "SP2", "SP3", "SP4"],
    roster: [
      // SP1: present recently (no sales for weeks is normal, and bills are not an input)
      { salesperson_id: "SP1", date: "2026-10-31", status: "Present" },
      // SP2: drops off the roster on 1 Sep -> left
      { salesperson_id: "SP2", date: "2026-09-01", status: "Present" },
      // SP3: still on the roster, but only Off since 1 Sep -> absent, not left
      { salesperson_id: "SP3", date: "2026-09-01", status: "Present" },
      { salesperson_id: "SP3", date: "2026-10-31", status: "Off" },
    ],
  });
  assert.deepEqual(out, {
    left: [{ salesperson_id: "SP2", last_on_roster: "2026-09-01", last_present: "2026-09-01" }],
    absent: [{ salesperson_id: "SP3", last_present: "2026-09-01" }],
    notOnRoster: ["SP4"],
  });
});
