# Store Coach database (Supabase)
Tables: `stores`, `area_managers`, `store_metrics`, `salesperson_metrics`, `issues` (evidence lives in `issues.evidence` jsonb), `cards`, `dq_flags`, `runs`; shapes follow `types/index.ts`.
Re-create: run `supabase/migrations/*.sql` in order (Supabase SQL editor, `supabase db push`, or the MCP `apply_migration`), then regenerate `lib/db/database.types.ts`.
Security: RLS is on everywhere; the anon/publishable key can only SELECT the read tables, `salesperson_metrics` is server-only, and all writes use the service role.
Keys: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable) and `SUPABASE_SERVICE_ROLE_KEY` live in `.env.local` (gitignored) and in Vercel env vars, never in code.
Smoke test: `npx tsx --conditions=react-server --env-file=.env.local supabase/scripts/smoke.ts` (insert, read, delete one row; checks anon cannot write).
