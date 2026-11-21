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

## Sagnik judge guidance - task 4
- Added a short How to read this line under the headline and the requested Try demo: open the biggest problem button. It opens the highest-rupee scorecard problem with available evidence, focuses the evidence region, and exposes the existing action-card link. If no evidence is available the demo button is disabled with an explanation.
- Verified at 390 px and desktop: exactly two clicks from home to evidence to card, focus moves into evidence, Replay is available and there is no page overflow. Production build, ESLint and Impeccable passed; screenshots inspected.

## Naman F1 detectors checkpoint - 21 Nov 2026
- Done: `engine/detectors.ts` (9 detectors + DQ guard), `engine/rupees.ts`, `engine/scorecard.ts` ("Problems from the brief", 13 rows). `npm run load` now writes `data/generated/{issues,scorecard,evidence,am-briefs,card-inputs}.json` and upserts **21 issues** into Supabase (evidence inside `issues.evidence`, no separate table). 18 salesperson card inputs (evidence + allowedNumbers). `npm test` 34 pass; `check:baseline` passes.
- Found: LKO-02 top seller left (₹3,12,900) · BLR-03 weekend understaffing (₹2,02,800) · Kanpur city slowdown (market note, ₹6,21,100) · BLR-02 Indo-Western avoidance · PAT-01 two heavy discounters · 4 missing-pair sellers · low-repeat sellers · BLR-01 role model. Dropped: MYS-02, KNP-03 discount (why in DECISIONS.md).
- **Type change (once):** `Evidence.subject?` (optional) = the salesperson a salesperson-level issue is about. Old fields kept. @Shubh @Sagnik: use it for `ActionCard.salesperson_id`. Salesperson-level issue ids end in `:SPxxxx`.
- **@Shubh:** the issues table is filled. Live `/api/scorecard`, `/api/issues`, `/api/brief?am=AM-01` already return `"source": "db"`. Redeploy so `/api/scorecard` picks up the 13-row catalogue in `data/sample/scorecard.json` (currently 9).
- Next: F3 prompt + number validator in `engine/` and plug `aiStep` into `app/api/_lib/make-card.ts`.

## Sagnik live-data follow-up during task 5
- Real detector data arrived during recording-path validation. The biggest issue became Kanpur's city slowdown. The card link had requested audience salesperson, causing the UI's 60-word salesperson guard to hide a valid 63-word manager card.
- Fixed only UI routing: city slowdown evidence passes audience=am through the card page and existing POST contract. Store problems retain salesperson. Template cards without a rejected_draft now use the general Validator result label rather than Rejected draft validation.
- Verified against live API fixtures: two clicks request audience am, the manager text is visible under For your stores, validation passes and there is no 390 px overflow. Production build and Impeccable passed. Updated recording script will use the actual LKO-02 values and conditionally show rejection only when present.

## Sagnik demo script - task 5
- Added docs/demo-script.md with a 1:55 click-by-click recording plan, 189 spoken words, matching PLAN.md section 1's five beats. PLAN.md was untouched. Checked the LKO-02 recording route against live evidence (10.4%, baseline 12.6%, rupees 3,12,900), card source/validation and no-follow-up state. Script explicitly adapts when values or rejection availability change.
- Repeated live incognito QA after real data arrived: home now has 13 rows, all opened and closed at 390 px and desktop. Opened/closed all manager evidence panels across AM-01 through AM-06. Biggest-problem card route now passes audience=am and works live in two clicks. No page overflow or UI error alerts across all eight routes at either width. Saved and inspected all updated screenshots.
- The current live card is a passing template without a rejected draft; Replay was verified in the earlier sample-state live QA and controlled fixtures. The recording script only uses the rejection beat when it is actually present. Current empty briefs are AM-04 and AM-06; the original AM-02 empty state and its failure/retry paths were verified before the DB filled and with controlled responses.
- Task 5 production build passed and Impeccable returned no findings. Shared progress-log rebase conflict resolved by retaining both Naman's and Sagnik's append-only entries.
## Shubh review checkpoint - 21 Nov 2026, 13:40 IST (code review + security review of main)
- Clean: no keys in git (tracked files and history) or in the client bundle; `.env*` and `local-data/` never tracked. RLS tested live with the anon key: every table rejects insert/update/delete, `salesperson_metrics` unreadable. Supabase advisors: 0 security findings (only INFO unused indexes). `/api/run` fails closed without `CRON_SECRET`. All API routes serve the sample (no 500) when env is missing. The demo does not need Gemini: live `/api/card` returns the template in ~1.3 s.
- Fixed (Shubh folders): template card now keeps to 60 words (one was 63 with `passed: true`); cards set `salesperson_id` from `evidence.subject`; `runs.error` stores a generic message because `/api/run-log` is public.
- **@Naman, team decision needed (privacy):** `issues.evidence` / `cause` / `action` (anon-readable, and committed in `data/generated/issues.json`, `evidence.json`, `card-inputs.json`) now carry salesperson names next to their personal discount %, repeat rate and shift attendance (e.g. "Manoj N.: discount off MRP 7.1%"). That is the data `salesperson_metrics` keeps server-only, and CLAUDE.md says only aggregates go to Supabase or `data/`. Options: use salesperson_id only in public evidence (names resolved server-side), or accept it for the demo and say so. Area manager full names are also public (`area_managers.name`). I have not changed anything here.
- **@Naman, review findings in engine/ and scripts/ (not edited by me):**
  - Important: `city_slowdown` (KNP-01, ₹6,21,100) is summed into the home ₹ total (₹13.7L) and wins "open the biggest problem" over LKO-02. Exclude market notes (and ₹0 `role_model`) from the scorecard ₹ and the biggest-problem pick (`engine/detectors.ts` ~467, `components/scorecard.tsx`).
  - Important: ₹ figures use the unrounded gap while steps show the rounded one, so the chain does not add up (LKO-02: 1.6 ÷ 100 × 1,935 × ₹9,801 = ₹3,03,400 vs ₹3,12,900 shown; same in discount). Round once and use the rounded gap for both (`engine/detectors.ts` ~280, ~640).
  - Important: `role_model` and missed-shift `staff_absent_or_left` become salesperson card inputs, but their action is for the store manager, so the named person gets "Store manager: ask <you> to…" (`scripts/load.ts` ~49).
  - Important: `numberTokens` skips numbers after a hyphen ("-18%", "9-11%"), so the F3 validator would miss invented numbers (`engine/detectors.ts` ~169).
  - Nits: `role_model` takes AM alert slots (`amTop`); low-repeat divides ~335 days by 365 (~8% low); "last on roster" step has value 47 days vs display "14 Sep"; loader header says "no names"; an em dash in a doc comment (`engine/detectors.ts` ~683).
- Second code review (Shubh folders) fixed, 26 tests: `/api/run` picks each card's audience with `cardAudience` (salesperson only for missing_pair, category_avoidance, discount_above_norm, low_repeat with a subject; city notes, staffing and role models go to the manager); manager cards never carry a `salesperson_id`; `/api/card` serves the newest saved card first (so the 18 cards already in `cards`, incl. validated Gemini ones, show without a live Gemini call) and returns a retryable 503, not 404, when the DB is down; AM briefs break rupee ties by stored rank then id; `AI_TIMEOUT_MS` is capped at 8000 (browser aborts at 10 s); smoke test always cleans up.
- **@Naman:** (1) please widen `npm test` to `tsx --test tests/*.test.ts lib/db/*.test.ts app/api/_lib/*.test.ts` (26 backend tests are not in it); (2) your validator has landed, so `aiStep` in `app/api/_lib/make-card.ts` can be wired now; (3) the saved `role_model` card in `cards` is marked `salesperson` though its action is for the store manager.
- **@Sagnik:** `components/evidence-chain.tsx` sends `audience=salesperson` for everything except city_slowdown. To match the cards the run saves, use `am` for role_model, staff_absent_or_left and understaffed_busy_days too (rule: `cardAudience` in `app/api/_lib/card.ts`).
- Accepted as is: `runs.rows_read` for a cron run = issue rows read (loader runs count CSV rows).
