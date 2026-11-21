// npm run load — read local-data CSVs, compute aggregates with engine/, upsert to Supabase.
// Also writes data/generated/*.json (PLAN §10 backup; no names, no customer IDs, safe to commit).
// Runs locally only. Never prints row contents, names or keys.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { loadDataset } from "../engine/data";
import { buildStoreDays } from "../engine/metrics";
import { dqFlagRows, salespersonMetricsRows, storeMetricsRows } from "../engine/rows";
import { amTop, detectAll, explainConversion } from "../engine/detectors";
import { buildBriefScorecard } from "../engine/scorecard";
import type { AmBrief, Evidence, Issue, RunLog } from "../types";

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

// ---------- Detectors: issues, evidence, scorecard, AM briefs, salesperson card inputs ----------
const t1 = Date.now();
const { issues, ctx } = detectAll(input);
// Computed notes for scorecard rows that come back not_found: named leads and stores explained by a sharper cause.
const leadNote = (id: string) => {
  const e = explainConversion(ctx, id);
  if (!e || e.holds) return null;
  const bits = [e.gap > -1 ? `${(-e.gap).toFixed(2)} pts worse than peers, under the 1-point bar` : null, e.z < 2 ? `not statistically significant (z ${e.z.toFixed(2)})` : null].filter(Boolean);
  return `${id}: conversion ${e.before.toFixed(2)}% → ${e.after.toFixed(2)}%, ${bits.join(", ")}; dropped.`;
};
const explained = [...ctx.judged].filter((id) => explainConversion(ctx, id)?.holds && issues.some((i) => i.store_id === id && i.lever === "more_bills" && i.type !== "conversion_drop_footfall_steady"));
const notes = {
  conversion_drop_footfall_steady: [
    explained.length ? `${explained.join(", ")}: the drop is there, but a sharper cause explains it (${explained.map((id) => issues.find((i) => i.store_id === id && i.lever === "more_bills")!.type).join(", ")}).` : null,
    ...["MYS-02", "BLR-01"].map(leadNote),
  ].filter(Boolean).join(" "),
};
const scorecard = buildBriefScorecard(AS_OF, issues, dqFlags, notes);
const top = amTop(issues, 5);
const briefs: AmBrief[] = ds.area_managers.map((am) => ({
  area_manager_id: am.area_manager_id, name: am.name, city: am.city, as_of: AS_OF, max_alerts_per_week: am.max_alerts_per_week,
  issues: (top[am.area_manager_id] ?? []).slice(0, am.max_alerts_per_week),
  market_note: issues.find((i) => i.area_manager_id === am.area_manager_id && i.type === "city_slowdown")?.cause ?? null,
}));
// One evidence JSON per flagged salesperson: the only input the Gemini step may use.
const cardInputs: { issue_id: string; salesperson_id: string; audience: "salesperson"; evidence: Evidence }[] = issues
  .filter((i) => i.evidence.subject)
  .map((i) => ({ issue_id: i.id, salesperson_id: i.evidence.subject!.salesperson_id, audience: "salesperson", evidence: i.evidence }));
const badRs = issues.filter((i) => !Number.isFinite(i.rupees_at_stake) || i.rupees_at_stake < 0);
if (badRs.length) throw new Error(`${badRs.length} issues with invalid ₹ at stake; refusing to write`);
console.log(`detect  ${issues.length} issues in ${Date.now() - t1} ms; ${cardInputs.length} salesperson card inputs`);
// IDs, types and ₹ only. Never names.
for (const am of ds.area_managers) {
  const list = top[am.area_manager_id] ?? [];
  console.log(`  ${am.area_manager_id} top ${list.length}: ${list.map((i) => `#${i.rank} ${i.store_id} ${i.type} ₹${i.rupees_at_stake.toLocaleString("en-IN")}${i.evidence.subject ? ` ${i.evidence.subject.salesperson_id}` : ""}`).join(" | ") || "none"}`);
}
for (const r of scorecard.rows) console.log(`  brief   ${r.status.padEnd(10)} ${r.type.padEnd(32)} ${r.store_ids.join(",")}`);
for (const id of ["MYS-02", "BLR-01"]) {
  const e = explainConversion(ctx, id);
  if (e) console.log(`  lead    ${id} conversion ${e.before}→${e.after}, gap vs peers ${e.gap} pts, z ${e.z} → ${e.holds ? "HOLDS" : "DROP"}`);
}

// ---------- JSON backup (aggregates only) ----------
mkdirSync("data/generated", { recursive: true });
const write = (name: string, data: unknown) => writeFileSync(`data/generated/${name}.json`, JSON.stringify(data, null, 1) + "\n");
write("stores", stores);
write("store-metrics", storeMetrics);
write("dq-flags", dqFlags);
const note = "Generated by npm run load from local-data (aggregates; salesperson first name + initial only, as the synthetic data gives them).";
write("issues", { _note: note, as_of: AS_OF, issues });
write("scorecard", { _note: note, ...scorecard });
write("evidence", { _note: note, as_of: AS_OF, evidence: Object.fromEntries(issues.map((i) => [i.id, i.evidence])) });
write("am-briefs", { _note: note, as_of: AS_OF, briefs });
write("card-inputs", { _note: note, as_of: AS_OF, inputs: cardInputs });
console.log("wrote   data/generated/{stores,store-metrics,dq-flags,issues,scorecard,evidence,am-briefs,card-inputs}.json");

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
    // Evidence lives inside issues.evidence (jsonb), so an issue and its numbers are written together.
    await upsert("issues", issues as Issue[], "id");
    const keep = issues.map((i) => `"${i.id}"`).join(",");
    const { error: delErr, count } = await db.from("issues").delete({ count: "exact" }).eq("as_of", AS_OF).not("id", "in", `(${keep})`);
    if (delErr) throw new Error(`issues cleanup: ${delErr.message}`);
    if (count) console.log(`removed ${count} stale issues for ${AS_OF}`);
    run.issues = issues.length;
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
