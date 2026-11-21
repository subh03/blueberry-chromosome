# PROGRESS

**Live link:** (none yet; target live by 12:00)
**Repo:** github.com/subh03/blueberry-chromosome

## Done
- 11:20 Plan + handshake contract (`PLAN.md`, `types/index.ts`, `data/sample/*.json`, `.env.example`). Naman
- 11:20 Fleet numbers cross-checked in pandas: conversion 12.95%, items/bill 1.96 ✔. Naman
- `npm run check:baseline` green in TS: conversion 12.95% PASS, IPB 1.96 PASS, LKO-02 flagged (conversion 12.61→11.01), BLR-03 flagged (presence 80.1→76.5). DQ: 84,001 packaging lines, PAT-03 11 store-days bills>footfall (all zero/missing footfall), BLR-05 too new, 43 inferred leavers, Diwali 2025 bills −8%. Leads: KNP-03 + PAT-01 discount HOLD, MYS-02 DROP. Engine in `engine/` (metrics, compare, dq, csv, data), 8 tests via `npm test`. Naman

- `npm run load` works: computes 20 stores, 59 store_metrics (3 windows; BLR-05 has no May-Jul row), 140 salesperson_metrics, 11 dq_flags, and writes `data/generated/*.json` (aggregates only). Upserts area_managers, stores, store_metrics, salesperson_metrics, dq_flags + a `runs` row when `.env.local` has the Supabase URL + service key. Not yet run against Supabase from Naman's Mac (no `.env.local`). Naman

## In progress
- Naman: P1 detectors + ₹ at stake (next)
- Shubh: Supabase project + `0001_init.sql`, Vercel project + env, `/api/card` stub, deploy by 12:00
- Sagnik: home scorecard from `data/sample/scorecard.json`

## Broken
- (none)

## Next
- 12:00 tracer bullet live on a phone in incognito

## Sagnik UI checkpoint - 21 Nov 2026, 12:00 IST
- Done: home scorecard and expandable evidence; manager brief capped at five and ranked by rupees; phone action card with source/validator panel; data-quality strip; run history and follow-up badge. Each feature committed and pushed separately.
- Verified: production build after every feature, Impeccable detector, desktop/mobile screenshots inspected, two-tap evidence-to-card flow, unknown-card empty state, unknown-manager error/retry, mobile page overflow check. Scoped UI ESLint passes after effect and Link fixes.
- Broken / pending integration: DESIGN.md and PRODUCT.md have not arrived. No design-specific motion added. API adapter uses GET /api/scorecard, /api/issues, /api/dq-flags and /api/run-log, whose routes are pending Shubh. Existing /api/brief?am= and POST /api/card contracts are wired. Sample mode works with NEXT_PUBLIC_USE_SAMPLE=1.
- Contract observations for Naman: scorecard supplies nine rows but only two detailed issues. Template card supplies rejected_draft with validation.passed=true; its validator word_count is 44, while whitespace counting gives 45. UI preserves the supplied result and only shows the exact trust beat when template + failed validation.
- Next: incorporate Naman's DESIGN.md / PRODUCT.md, then verify live API reads with Shubh. No dependency or handshake type edits were made.
