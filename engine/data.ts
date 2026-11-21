// Reads the Manyavar CSVs from LOCAL_DATA_DIR into typed rows. Only I/O lives here;
// all metric logic is in metrics.ts / compare.ts / dq.ts. Never log row contents.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCsv } from "./csv";
import type { BillLineRow, BillRow, FootfallRow, ItemRow, RosterRow } from "./metrics";

export const DEFAULT_DATA_DIR = "local-data/manyavar-vch3-data/csv";

export interface StoreRow {
  store_id: string; city: string; state: string; zone: string; tier: string;
  opened_on: string; area_manager_id: string;
}

export interface CalendarRow { date: string; state: string; festival: string; is_wedding_date: boolean }

export interface Dataset {
  stores: StoreRow[];
  items: ItemRow[];
  bills: BillRow[];
  lines: BillLineRow[];
  footfall: FootfallRow[];
  roster: RosterRow[];
  // name = first name + initial as in the data. Only for salesperson_metrics (server-only). Never print it.
  salespeople: { salesperson_id: string; store_id: string; join_date: string; name: string }[];
  area_managers: { area_manager_id: string; name: string; city: string; max_alerts_per_week: number }[];
  calendar: CalendarRow[];
}

export function loadDataset(dir = process.env.LOCAL_DATA_DIR || DEFAULT_DATA_DIR): Dataset {
  const read = (name: string) => parseCsv(readFileSync(join(dir, `${name}.csv`), "utf8"));
  const num = (s: string) => Number(s);
  return {
    stores: read("stores").map((r) => ({
      store_id: r.store_id, city: r.city, state: r.state, zone: r.zone, tier: r.tier,
      opened_on: r.opened_on, area_manager_id: r.area_manager_id,
    })),
    items: read("items").map((r) => ({ sku_id: r.sku_id, category: r.category, mrp: num(r.mrp), is_packaging: r.is_packaging === "1" })),
    bills: read("bills").map((r) => ({
      bill_id: r.bill_id, bill_date: r.bill_date, store_id: r.store_id, salesperson_id: r.salesperson_id, customer_id: r.customer_id,
    })),
    lines: read("bill_lines").map((r) => ({
      bill_id: r.bill_id, sku_id: r.sku_id, qty: num(r.qty), mrp: num(r.mrp), selling_price: num(r.selling_price),
    })),
    footfall: read("footfall_daily").map((r) => ({ date: r.date, store_id: r.store_id, footfall: num(r.footfall) })),
    roster: read("roster_daily").map((r) => ({ date: r.date, store_id: r.store_id, salesperson_id: r.salesperson_id, status: r.status })),
    salespeople: read("salespeople").map((r) => ({ salesperson_id: r.salesperson_id, store_id: r.store_id, join_date: r.join_date, name: r.name })),
    area_managers: read("area_managers").map((r) => ({
      area_manager_id: r.area_manager_id, name: r.name, city: r.city, max_alerts_per_week: num(r.max_alerts_per_week),
    })),
    calendar: read("calendar").map((r) => ({ date: r.date, state: r.state, festival: r.festival, is_wedding_date: r.is_wedding_date === "1" })),
  };
}
