// npm run cards:origins — one-off backfill: write draft_origin into cards.validation (no column exists).
// gemini = Gemini text or a rejected Gemini draft; injected_test = the labelled stress test; pure template = unset.
// Prints counts only.
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { ActionCard } from "../types";
import { draftOriginOf, originForCard, withDraftOrigin } from "../engine/card-origin";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase keys not set in .env.local");
const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await db.from("cards").select("id,source,rejected_draft,validation");
  if (error) throw new Error(error.message);
  const tally: Record<string, number> = {};
  for (const row of data as Pick<ActionCard, "id" | "source" | "rejected_draft" | "validation">[]) {
    const origin = originForCard(row);
    tally[origin ?? "unset"] = (tally[origin ?? "unset"] ?? 0) + 1;
    if (draftOriginOf(row) === origin) continue;
    const { validation } = withDraftOrigin(row as ActionCard, origin);
    const { error: e } = await db.from("cards").update({ validation }).eq("id", row.id);
    if (e) throw new Error(`${row.id}: ${e.message}`);
  }
  console.log(`cards ${data!.length}: ${JSON.stringify(tally)}`);
}
main().catch((e) => { console.error(`FAILED  ${e instanceof Error ? e.message : e}`); process.exit(1); });
