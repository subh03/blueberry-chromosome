// DB smoke test: insert, read and delete one test row in store_metrics with the server client,
// then confirm the anon client can read but not write.
// Run: npx tsx --conditions=react-server --env-file=.env.local supabase/scripts/smoke.ts
import { getServerDb } from "@/lib/db/server";
import { getBrowserDb } from "@/lib/db/browser";

const row = {
  store_id: "TEST-SMOKE",
  as_of: "1999-01-01",
  window: "all_time",
  footfall: 100,
  bills: 13,
  conversion: 13,
  ipb: 1.96,
  discount_pct: 0,
  repeat_rate: null,
  avg_bill_value: 1000,
  presence: null,
};
const key = { store_id: row.store_id, as_of: row.as_of, window: row.window };

async function main() {
  const db = getServerDb();
  const anon = getBrowserDb();
  try {
    await checks(db, anon);
  } finally {
    // Always clean up, even when a check fails, so no test rows stay in the public table.
    await db.from("store_metrics").delete().in("store_id", ["TEST-SMOKE", "TEST-ANON"]);
  }
}

async function checks(db: ReturnType<typeof getServerDb>, anon: ReturnType<typeof getBrowserDb>) {

  const ins = await db.from("store_metrics").upsert(row);
  if (ins.error) throw new Error(`insert: ${ins.error.message}`);
  console.log("✔ insert (service role)");

  const read = await anon.from("store_metrics").select("*").match(key).single();
  if (read.error || read.data.bills !== 13) throw new Error(`read: ${read.error?.message ?? "wrong data"}`);
  console.log("✔ read back (anon), bills =", read.data.bills);

  const anonWrite = await anon.from("store_metrics").insert({ ...row, store_id: "TEST-ANON" });
  if (!anonWrite.error) throw new Error("anon was able to write: RLS is broken");
  console.log("✔ anon write blocked:", anonWrite.error.code);

  const anonSp = await anon.from("salesperson_metrics").select("*").limit(1);
  if (!anonSp.error && (anonSp.data?.length ?? 0) > 0) throw new Error("anon can read salesperson_metrics");
  console.log("✔ salesperson_metrics hidden from anon");

  const del = await db.from("store_metrics").delete().match(key).select();
  if (del.error || del.data.length !== 1) throw new Error(`delete: ${del.error?.message ?? "row not deleted"}`);
  console.log("✔ delete (service role)\nDB smoke test passed.");
}

main().catch((err) => {
  console.error("✖", err instanceof Error ? err.message : err);
  process.exit(1);
});
