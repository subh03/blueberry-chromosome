// npm run load — read local-data CSVs, compute aggregates with engine/, upsert to Supabase.
// Also writes data/generated/*.json (PLAN §10 backup; no names, no customer IDs, safe to commit).
// Runs locally only. Never prints row contents, names or keys.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { loadDataset } from "../engine/data";
import { buildStoreDays } from "../engine/metrics";
import { dqFlagRows, salespersonMetricsRows, storeMetricsRows } from "../engine/rows";
import type { RunLog } from "../types";

const AS_OF = "2026-10-31";
for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);

const started_at = new Date().toISOString();
const t0 = Date.now();
const ds = loadDataset();
const rows_read = ds.bills.length + ds.lines.length + ds.footfall.length + ds.roster.length + ds.salespeople.length + ds.stores.length + ds.items.length;
const days = buildStoreDays(ds);
const input = { asOf: AS_OF, ...ds };

const stores = ds.stores.map((s) => ({
  store_id: s.store_id, city: s.city, state: s.state, tier: s.tier, opened_on: s.opened_on, area_manager_id: s.area_manager_id,
}));
const storeMetrics = storeMetricsRows(input, days);
const spMetrics = salespersonMetricsRows(input);
const dqFlags = dqFlagRows(input, days);
console.log(`computed in ${Date.now() - t0} ms from ${rows_read} rows: ${stores.length} stores, ${storeMetrics.length} store_metrics, ${spMetrics.length} salesperson_metrics, ${dqFlags.length} dq_flags`);

// Sanity: the numbers the hour-1 check pinned must survive into the rows we write.
const lko02 = storeMetrics.find((m) => m.store_id === "LKO-02" && m.window === "baseline_mayjul");
console.log(`sanity  LKO-02 baseline conversion ${lko02?.conversion}% ipb ${lko02?.ipb}; inferred_left ${spMetrics.filter((s) => s.inferred_left).length}`);
const bad = [...storeMetrics, ...spMetrics].filter((r) => Object.values(r).some((v) => typeof v === "number" && !Number.isFinite(v)));
if (bad.length) throw new Error(`${bad.length} rows contain NaN/Infinity; refusing to write`);

// ---------- JSON backup (aggregates only) ----------
mkdirSync("data/generated", { recursive: true });
const write = (name: string, data: unknown) => writeFileSync(`data/generated/${name}.json`, JSON.stringify(data, null, 1) + "\n");
write("stores", stores);
write("store-metrics", storeMetrics);
write("dq-flags", dqFlags);
console.log("wrote   data/generated/{stores,store-metrics,dq-flags}.json");

// ---------- Supabase ----------
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log("skipped Supabase: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (add them to .env.local)");
  process.exit(0);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function upsert(table: string, rows: object[], onConflict: string) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + 500), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`upsert  ${table.padEnd(20)} ${rows.length}`);
}

async function main(): Promise<boolean> {
  const run: Omit<RunLog, "id"> = {
    trigger: "load", started_at, finished_at: null, as_of: AS_OF, rows_read,
    issues: 0, cards: 0, gemini_ok: 0, gemini_fallback: 0, ok: false, error: null,
  };
  try {
    await upsert("area_managers", ds.area_managers, "area_manager_id");
    await upsert("stores", stores, "store_id");
    await upsert("store_metrics", storeMetrics, "store_id,as_of,window");
    await upsert("salesperson_metrics", spMetrics, "salesperson_id,as_of");
    await upsert("dq_flags", dqFlags, "id");
    run.ok = true;
  } catch (e) {
    run.error = e instanceof Error ? e.message : String(e);
    console.error(`FAILED  ${run.error}`);
  }
  run.finished_at = new Date().toISOString();
  const { error } = await db.from("runs").insert(run);
  if (error) console.error(`runs: ${error.message}`);
  else console.log(`run log written (ok=${run.ok})`);
  return run.ok;
}

main().then((ok) => process.exit(ok ? 0 : 1));
