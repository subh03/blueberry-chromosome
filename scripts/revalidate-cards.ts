// npm run cards:audit — re-run the full validator (numbers + semantic checks) over every stored card.
// Reads the cards table (read only), matches each card to its issue in data/generated/issues.json,
// writes data/generated/card-semantic-audit.json. Never prints keys.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { ActionCard, Issue } from "../types";
import { validateCard } from "../engine/card-validator";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);
const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6) ?? "card-semantic-audit";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase URL / service key not set in .env.local");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("cards").select("*").order("created_at");
  if (error) throw new Error(error.message);
  const cards = data as ActionCard[];
  const { issues } = JSON.parse(readFileSync("data/generated/issues.json", "utf8")) as { issues: Issue[] };
  const byId = new Map(issues.map((i) => [i.id, i]));

  const rows = cards.map((c) => {
    const issue = byId.get(c.issue_id);
    if (!issue) return { id: c.id, issue_id: c.issue_id, audience: c.audience, source: c.source, passed: false, reasons: ["issue not found"] };
    const v = validateCard(c.text, issue.evidence, issue.action);
    return { id: c.id, issue_id: c.issue_id, audience: c.audience, source: c.source, origin: c.validation?.draft_origin ?? null, passed: v.passed, word_count: v.word_count, reasons: v.reasons };
  });
  const failed = rows.filter((r) => !r.passed);
  writeFileSync(`data/generated/${out}.json`, JSON.stringify({
    _note: "Every stored card's shown text re-checked with the number validator plus the semantic checks (engine/card-semantics.ts).",
    ran_at: new Date().toISOString(), cards: rows.length, failed: failed.length, rows,
  }, null, 1) + "\n");
  for (const r of rows) console.log(`${r.passed ? "pass" : "FAIL"}  ${r.id}${r.reasons.length ? `  [${r.reasons.join("; ")}]` : ""}`);
  console.log(`audit   ${rows.length} cards, ${failed.length} fail -> data/generated/${out}.json`);
}

main().catch((e) => { console.error(`FAILED  ${e instanceof Error ? e.message : e}`); process.exit(1); });
