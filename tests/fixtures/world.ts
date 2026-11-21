// Synthetic, deterministic "world" for detector tests. No real data: every row is generated here.
// A store has a footfall and conversion curve; bills are spread over the sellers on the roster that day.
import type { BillLineRow, BillRow, FootfallRow, ItemRow, RosterRow } from "../../engine/metrics";
import { addDays } from "../../engine/dq";

export interface SellerSpec {
  id: string;
  name?: string;
  weight?: number; // share of the store's bills on days present (default 1)
  lastRoster?: string; // roster rows stop after this date (= left)
  present?: (date: string) => boolean; // default: off one weekday per week
  jacketP?: number; // P(jacket | kurta bill), default 0.25
  sherwaniAddP?: number; // P(safa/mojari/mala | sherwani bill), default 0.8
  indoP?: number; // P(bill has Indo-Western), default 0.08
  discount?: number; // discount fraction on every line, default 0.01 on 20% of lines
  repeatP?: number; // P(customer comes back 45 days later), default 0.07
  sells?: (date: string) => boolean; // on the floor but gets no bills when false (default true)
}

export interface StoreSpec {
  store_id: string;
  city: string;
  state: string;
  tier?: string;
  opened_on?: string;
  area_manager_id?: string;
  footfall: (date: string) => number;
  conv: (date: string) => number; // %
  sellers: SellerSpec[];
  recordedFootfall?: (date: string, real: number) => number; // what the door camera wrote (default = real)
}

export interface World {
  stores: { store_id: string; city: string; state: string; zone: string; tier: string; opened_on: string; area_manager_id: string }[];
  items: ItemRow[];
  bills: BillRow[];
  lines: BillLineRow[];
  footfall: FootfallRow[];
  roster: RosterRow[];
  salespeople: { salesperson_id: string; store_id: string; join_date: string; name: string }[];
  calendar: { date: string; state: string; festival: string; is_wedding_date: boolean }[];
}

export const ITEMS: ItemRow[] = [
  { sku_id: "KUR-1", category: "Kurta Set", mrp: 5000, is_packaging: false },
  { sku_id: "JAC-1", category: "Jacket", mrp: 3000, is_packaging: false },
  { sku_id: "SHE-1", category: "Sherwani", mrp: 20000, is_packaging: false },
  { sku_id: "SAF-1", category: "Safa", mrp: 1500, is_packaging: false },
  { sku_id: "IND-1", category: "Indo-Western", mrp: 9000, is_packaging: false },
  { sku_id: "PKG-1", category: "Packaging", mrp: 0, is_packaging: true },
];

export const dow = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay();
export const isWeekend = (d: string) => dow(d) === 0 || dow(d) === 6;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

export function buildWorld(o: {
  from: string;
  to: string;
  stores: StoreSpec[];
  diwali?: string[];
  rosterFrom?: string;
  seed?: number;
}): World {
  const r = rng(o.seed ?? 7);
  const rosterFrom = o.rosterFrom ?? "2026-05-01";
  const w: World = { stores: [], items: ITEMS, bills: [], lines: [], footfall: [], roster: [], salespeople: [], calendar: [] };
  const states = [...new Set(o.stores.map((s) => s.state))];
  for (const d of o.diwali ?? []) for (const st of states) w.calendar.push({ date: d, state: st, festival: "Diwali", is_wedding_date: false });

  let billNo = 0;
  let custNo = 0;
  const later: { date: string; store: string; cust: string }[] = [];
  for (const s of o.stores) {
    const opened = s.opened_on ?? "2015-01-01";
    w.stores.push({
      store_id: s.store_id, city: s.city, state: s.state, zone: "Z", tier: s.tier ?? "A",
      opened_on: opened, area_manager_id: s.area_manager_id ?? `AM-${s.city}`,
    });
    s.sellers.forEach((p) => w.salespeople.push({ salesperson_id: p.id, store_id: s.store_id, join_date: "2020-01-01", name: p.name ?? `Seller ${p.id}` }));
    let carry = 0;
    for (let d = o.from > opened ? o.from : opened; d <= o.to; d = addDays(d, 1)) {
      const ff = Math.round(s.footfall(d));
      w.footfall.push({ date: d, store_id: s.store_id, footfall: s.recordedFootfall ? s.recordedFootfall(d, ff) : ff });
      const onFloor = s.sellers.filter((p, i) => {
        if (p.lastRoster && d > p.lastRoster) return false;
        const present = p.present ? p.present(d) : dow(d) !== ((i % 5) + 1);
        if (d >= rosterFrom) w.roster.push({ date: d, store_id: s.store_id, salesperson_id: p.id, status: present ? "Present" : "Off" });
        return present;
      });
      const exact = (ff * s.conv(d)) / 100 + carry;
      const n = Math.floor(exact);
      carry = exact - n;
      const selling = onFloor.filter((p) => !p.sells || p.sells(d));
      const totalW = selling.reduce((a, p) => a + (p.weight ?? 1), 0);
      for (let k = 0; k < n && selling.length; k++) {
        let x = r() * totalW;
        const p = selling.find((q) => (x -= q.weight ?? 1) < 0) ?? selling[selling.length - 1];
        const ret = later.findIndex((l) => l.store === s.store_id && l.date <= d);
        const cust = ret >= 0 ? later.splice(ret, 1)[0].cust : `C${++custNo}`;
        const bill_id = `B${++billNo}`;
        w.bills.push({ bill_id, bill_date: d, store_id: s.store_id, salesperson_id: p.id, customer_id: cust });
        if (ret < 0 && r() < (p.repeatP ?? 0.07)) later.push({ date: addDays(d, 45), store: s.store_id, cust });
        const disc = (sku: string, mrp: number) => {
          const f = p.discount ?? (r() < 0.2 ? 0.05 : 0);
          w.lines.push({ bill_id, sku_id: sku, qty: 1, mrp, selling_price: Math.round(mrp * (1 - f)) });
        };
        if (r() < 0.1) {
          disc("SHE-1", 20000);
          if (r() < (p.sherwaniAddP ?? 0.8)) disc("SAF-1", 1500);
        } else {
          disc("KUR-1", 5000);
          if (r() < (p.jacketP ?? 0.25)) disc("JAC-1", 3000);
        }
        if (r() < (p.indoP ?? 0.08)) disc("IND-1", 9000);
        w.lines.push({ bill_id, sku_id: "PKG-1", qty: 1, mrp: 0, selling_price: 0 });
      }
    }
  }
  return w;
}

/** n plain sellers S<prefix>1..n. */
export const sellers = (prefix: string, n: number, extra: Partial<SellerSpec>[] = []): SellerSpec[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i + 1}`, ...(extra[i] ?? {}) }));
