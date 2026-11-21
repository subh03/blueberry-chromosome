// Pure metric functions. Owner: Naman. No I/O here: callers pass parsed rows.
// Definitions follow PLAN.md §2 "Metric definitions" (checked against pandas).

export interface BillRow {
  bill_id: string;
  bill_date: string; // YYYY-MM-DD
  store_id: string;
  salesperson_id: string;
  customer_id: string;
}

export interface BillLineRow {
  bill_id: string;
  sku_id: string;
  qty: number;
  mrp: number;
  selling_price: number;
}

export interface FootfallRow {
  date: string;
  store_id: string;
  footfall: number;
}

export interface ItemRow {
  sku_id: string;
  category: string;
  mrp: number;
  is_packaging: boolean;
}

export interface RosterRow {
  date: string;
  store_id: string;
  salesperson_id: string;
  status: string; // "Present" | "Off"
}

/** One store on one day. Aggregates only: no customer or salesperson IDs. */
export interface StoreDay {
  store_id: string;
  date: string;
  footfall: number;
  bills: number;
  items: number; // non-packaging qty
  mrp_value: number; // Σ mrp × qty, non-packaging
  sales_value: number; // Σ selling_price × qty, non-packaging
  packaging_lines: number;
}

export type Totals = Omit<StoreDay, "store_id" | "date"> & { days: number };

const key = (store: string, date: string) => `${store}|${date}`;

export function buildStoreDays(input: {
  bills: BillRow[];
  lines: BillLineRow[];
  items: ItemRow[];
  footfall: FootfallRow[];
}): StoreDay[] {
  const packaging = new Set(input.items.filter((i) => i.is_packaging).map((i) => i.sku_id));
  const days = new Map<string, StoreDay>();
  const get = (store_id: string, date: string) => {
    const k = key(store_id, date);
    let d = days.get(k);
    if (!d) {
      d = { store_id, date, footfall: 0, bills: 0, items: 0, mrp_value: 0, sales_value: 0, packaging_lines: 0 };
      days.set(k, d);
    }
    return d;
  };

  for (const f of input.footfall) get(f.store_id, f.date).footfall += f.footfall;

  const billDay = new Map<string, StoreDay>();
  for (const b of input.bills) {
    const d = get(b.store_id, b.bill_date);
    d.bills += 1;
    billDay.set(b.bill_id, d);
  }

  for (const l of input.lines) {
    const d = billDay.get(l.bill_id);
    if (!d) continue; // orphan line: no matching bill
    if (packaging.has(l.sku_id)) {
      d.packaging_lines += 1;
      continue;
    }
    d.items += l.qty;
    d.mrp_value += l.mrp * l.qty;
    d.sales_value += l.selling_price * l.qty;
  }

  return [...days.values()];
}

export function sumDays(days: StoreDay[]): Totals {
  const t: Totals = { days: 0, footfall: 0, bills: 0, items: 0, mrp_value: 0, sales_value: 0, packaging_lines: 0 };
  for (const d of days) {
    t.days += 1;
    t.footfall += d.footfall;
    t.bills += d.bills;
    t.items += d.items;
    t.mrp_value += d.mrp_value;
    t.sales_value += d.sales_value;
    t.packaging_lines += d.packaging_lines;
  }
  return t;
}

/** Conversion % = bills ÷ footfall × 100. */
export function conversion(t: Pick<Totals, "bills" | "footfall">): number {
  return t.footfall === 0 ? NaN : (t.bills / t.footfall) * 100;
}

/** Items per bill = non-packaging qty ÷ all bills. */
export function itemsPerBill(t: Pick<Totals, "items" | "bills">): number {
  return t.bills === 0 ? NaN : t.items / t.bills;
}

/** Discount % = Σ (mrp − selling_price) × qty ÷ Σ mrp × qty × 100, non-packaging. */
export function discountPct(t: Pick<Totals, "mrp_value" | "sales_value">): number {
  return t.mrp_value === 0 ? NaN : ((t.mrp_value - t.sales_value) / t.mrp_value) * 100;
}

/** Presence % = Present roster rows ÷ all roster rows × 100. */
export function presencePct(rows: RosterRow[]): number {
  if (rows.length === 0) return NaN;
  return (rows.filter((r) => r.status === "Present").length / rows.length) * 100;
}

export const inRange = (date: string, from: string, to: string) => date >= from && date <= to;
