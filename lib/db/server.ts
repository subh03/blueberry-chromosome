// Server-only Supabase client with the service role key. Bypasses RLS: use for writes
// in route handlers (/api/run, /api/card) and the local loader. Never import from client code.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { requireEnv } from "./env";

export type ServerDb = SupabaseClient<Database>;

let client: ServerDb | undefined;

export function getServerDb(): ServerDb {
  client ??= createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  return client;
}
