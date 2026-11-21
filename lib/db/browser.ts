// Browser-safe Supabase client with the publishable (anon) key. RLS makes it read-only.
// NEXT_PUBLIC_* vars are inlined at build time, so they must be read with literal names.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { requireEnv } from "./env";

export type BrowserDb = SupabaseClient<Database>;

let client: BrowserDb | undefined;

export function getBrowserDb(): BrowserDb {
  client ??= createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return client;
}
