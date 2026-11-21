# PROGRESS

**Live link:** https://blueberry-chromosome.vercel.app
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

## Shubh backend checkpoint - 21 Nov 2026, 12:25 IST
- Done: Supabase schema live (8 tables, RLS on, anon read-only, `salesperson_metrics` server-only, security advisor clean). `lib/db/` server + publishable clients, typed queries, `toAmBrief` with tests. API stubs on sample data: `/api/brief`, `/api/card` (8 s timeout -> template), `/api/run` (CRON_SECRET), `/api/scorecard`, `/api/issues`, `/api/dq-flags`, `/api/run-log`. Vercel cron `30 0 * * *`. Live on Vercel with env vars for Production + Preview.
- Broken / pending: `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` not set yet (locally or on Vercel), so the DB smoke test has not run. Routes still serve sample data, not Supabase.
- Next: once `npm run load` fills Supabase, switch the read routes to `lib/db/queries` and make `/api/run` write a `runs` row.

## Sagnik design checkpoint - 21 Nov 2026
- Done: applied DESIGN.md from 8ead95f. IBM Plex Sans / Condensed / Mono through next/font/google, shared colour and motion tokens, brass rupees, dot statuses, link-label arrow cleanup. Existing layouts retained.
- Done: total rupees rendered in the initial home HTML and aria-label; cosmetic 900 ms count-up once per session and shrinking row delays. Evidence thread, nodes and steps complete within 300 ms; repeated evidence opens skip the stagger.
- Done: phone draft rejection sequence and Replay, with underline/stamp drawn from validation.rejected_numbers. Pulled 873988f, which supplies 18% and rupee 40,000. Template-card validation is labelled as the rejected draft's result. Reduced motion shows the template and static draft audit with zero animations.
- Verified: production build and scoped ESLint pass, Impeccable detector returns no findings. Inspected desktop/mobile screenshots for home, manager brief and card. Playwright checked initial HTML total, no session replay, both rejected tokens, interruption by repeated Replay, final template, reduced motion, evidence reopening and no page overflow at 375 px.
- Decision: compressed the evidence-step start delays to 40/60/75/85/95/100 ms with 200 ms duration, meeting the explicit 300 ms limit. The original table's last listed step would finish at 370 ms.
- Next: integrate real engine/API data when the backend switches from sample stubs. No type, dependency, API route, environment or data-file edits were made by Sagnik.

## Shubh backend checkpoint - 21 Nov 2026, 13:00 IST
- Live: https://blueberry-chromosome.vercel.app (deploy `08e8029` READY, 0 runtime errors in logs). All 8 env vars set for Production + Preview.
- Real (reads Supabase, `"source": "db"`): `/api/dq-flags` (dq_flags, 11), `/api/run-log` (runs), `/api/brief?am=` for managers other than AM-01 (area_managers + issues via toAmBrief).
- Still sample (`"source": "sample"`) until Naman's detectors fill `issues`: `/api/scorecard`, `/api/issues`, `/api/brief?am=AM-01`, and `/api/card` for sample issue ids. They switch to the DB automatically, no code change.
- `/api/run` (CRON_SECRET) writes a `runs` row with all counts, ok and error; regenerates one card per issue into `cards`. Tested locally and in production.
- `/api/card`: Gemini client ready (GEMINI_MODEL, structured JSON, retry once, 8 s, live-tested). Returns the template until Naman plugs the prompt + validator into `aiStep` in `app/api/_lib/make-card.ts` (TODO marked).
- Tests: `npx tsx --test lib/db/*.test.ts app/api/_lib/*.test.ts` (19 pass). DB smoke script passes.
- Next: Naman wires `aiStep`; once `issues` has rows, check scorecard/issues/brief flip to `"source": "db"`.

## Sagnik live QA - task 1
- Fresh non-persistent browser contexts at 390x844 and 1440x1000. Checked live home, AM-01 through AM-06, and a card opened by issue ID. All 16 navigations returned HTTP 200, with no page overflow. Mobile page-error collection was empty.
- Opened and closed every home row at both widths, every available manager evidence panel, and replayed the phone rejection moment. Saved and inspected screenshots of every page at both widths. Impeccable detector returned no findings on the page components and CSS.
- AM-02 through AM-06 have empty briefs and show a message. The issues API reports sample provenance while the home heading says Store data; fixing this explicitly in task 3. The latest live run is manual with zero rows/issues/cards; the demo script must describe those actual values instead of the sample cron story.

## Sagnik list-state QA - task 2
- AM-02's empty brief now states that no issues were returned and offers a scorecard link. Missing cards (404) show an empty state with a recovery link. Empty metric-step lists have an explicit message. Error-page skip navigation now reaches main content.
- Verified delayed, empty and failed AM responses plus retry recovery in Playwright. Verified missing-card empty state. Forced flags/run-history loading, empty, error and retry states in a fresh context. Home list loading/empty/error branches and cancellation guards reviewed. Build passed; Impeccable returned no findings; phone and desktop empty-state screenshots inspected.

## Sagnik provenance - task 3
- API response source is read in lib/ui/data.ts and preserved as UI-only dataSource metadata. Sample data is shown quietly on home, manager, card and individual flag/run sections; db responses have no label. Static sample mode also labels its imports. Shared types and API files were untouched.
- Note for Naman: ActionCard.source already means gemini/template. The card label therefore uses the matching issue response's sample/db provenance, without overwriting generation source. A future card-specific provenance field can be consumed in this adapter if the backend supplies one.
- Verified sample and db fixtures on home, manager and card. Sample labels appeared in all relevant sections, db labels were absent. Production build passed, Impeccable returned no findings, desktop/mobile source screenshots inspected.
