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
- **@Naman:** (1) please widen `npm test` to `tsx --test tests/*.test.ts lib/db/*.test.ts app/api/_lib/*.test.ts` (26 backend tests are not in it); (2) thanks for wiring `aiStep`; I merged it with my changes (kept your engine templates + validator, added the audience guard); (3) the saved `role_model` card in `cards` is marked `salesperson` though its action is for the store manager.
- **@Sagnik:** `components/evidence-chain.tsx` sends `audience=salesperson` for everything except city_slowdown. To match the cards the run saves, use `am` for role_model, staff_absent_or_left and understaffed_busy_days too (rule: `cardAudience` in `app/api/_lib/card.ts`).
- Accepted as is: `runs.rows_read` for a cron run = issue rows read (loader runs count CSV rows).


## Naman F3 cards checkpoint - 21 Nov 2026
- Done: `engine/card-validator.ts` (numbers normalised: 18% = 18 %, ₹40,000 = 40k = Rs 40,000; store/staff IDs ignored; years, "2 weeks", "two", clock times and rounding rejected; unknown names; peer, action and "today/by" required), `engine/card-prompt.ts` (Gemini JSON `{text, numbers_used}`), `engine/card-templates.ts` (one per issue type, each passes the validator by test, wording via storyscope + humanizer), `engine/card-ai.ts` (retry carries the rejection reasons). Tests: 68 engine + Shubh's 22 pass; `next build` passes.
- Real Gemini runs (gemini-3.1-flash-lite, 8 s): run 2 = 18/18 cards from Gemini (17 first draft, 1 after retry), 19 calls. **Across both runs, 37 real drafts used 0 numbers outside the evidence.** All 7 rejections (6 in run 1, 1 in run 2) were validator false alarms ("Kurta Sets" read as a name, "observe/shadow" not seen as actions, "Currently," read as a name), now fixed with tests. Run 1 also hit a timeout bug in my script (pacing wait counted inside the deadline). Logs: `data/generated/card-run-log.json`, `card-run-log.run1.json`.
- 18 Gemini cards stored in `cards` (ids `gemini:<issue_id>:salesperson`, `salesperson_id` set).
- **@Sagnik @Shubh: the "draft rejected, template used" beat has NO real Gemini mistake to show.** I stored ONE stress-test card, id `stress-test:2026-10-31:PAT-01:discount_above_norm:SP1064:salesperson` (also `data/generated/stress-test-card.json`, `draft_origin: "injected test draft"`). Its `rejected_draft` starts with "Injected test draft (written by the team, not by Gemini):". UI and video must label it "Stress test: injected draft", never "Gemini got it wrong". Its created_at is older, so it never replaces PAT-01's real card.
- **@Shubh (changed your files, small):** `make-card.ts`: only the `aiStep` line + its import (now `cardAiStep` from `engine/card-ai`). `card.ts`: `templateCard` uses the engine template for salesperson cards with evidence, with the real validator result; your 60-word plain text stays for everything else (your tests pass). Please: (1) make `/api/card` read the latest stored card for the issue before calling Gemini, so the demo never waits; (2) add a way to fetch a card by id for the stress-test card; (3) redeploy.
- Not done: Hindi card (optional; the validator already reads Devanagari digits).
- Next: Shubh switches `/api/card` to stored cards; Sagnik labels the stress-test card; then the demo dry run.

## Naman review fixes - 21 Nov 2026 (Shubh's 4 engine findings)
- **npm test** now runs `tests/`, `lib/db/` and `app/api/_lib/`: **106 tests, all pass**.
- **Market note kept apart.** New optional `ScorecardRow.kind`: `"store" | "market_note" | "data_quality"` (old fields kept). Scorecard output (`data/generated/scorecard.json`, `data/sample/scorecard.json`) adds `store_rupees_at_stake` (₹7,60,100), `market_rupees_at_stake` (Kanpur, ₹6,18,300) and `biggest_issue_id` (now `2026-10-31:LKO-02:staff_absent_or_left`).
  - **@Sagnik:** home total = rows with `kind === "store"` only (or `store_rupees_at_stake`); "open the biggest problem" = `biggest_issue_id`, or the top `kind === "store"` row with ₹ > 0. Show the city row labelled "Market note" with its own ₹. `data_quality` rows are never alerts.
  - **@Shubh:** `/api/scorecard` builds its catalogue from the sample with only `lever, brief_problem, type`. Please also carry `kind` (and the three totals, or compute them the same way: `buildBriefScorecard` in `engine/scorecard.ts`), then redeploy.
- **₹ now reproduces from the evidence shown.** Each input is rounded once, exactly as displayed (gaps 1 decimal, computed from the two displayed rates; per-28-day counts 1 decimal; rupees whole). ₹ is computed from those values and rounded to ₹100 (the formula says so). A new test recomputes every issue's ₹ from the display strings. Totals moved slightly: LKO-02 ₹3,12,900 → **₹3,22,400** (1.7 ÷ 100 × 1,935 × ₹9,801), BLR-03 ₹1,99,600, Kanpur ₹6,18,300. **@Sagnik:** the demo script quotes ₹3,12,900; update it to ₹3,22,400.
- **Validator catches numbers after hyphens.** Fixed: week-2, top-3, 6-7% (read as 6% and 7%), 9-11%, 2-3 weeks, -18%. Uppercase codes (LKO-02, BLR-05) stay excluded. `numberTokens` (evidence) now uses the same tokenizer.
- **Cards re-checked against the new evidence.** 4 stored Gemini cards quoted the old rounded figures (6.8, 5.3, 6.6, ₹13,400). That was caused by the ₹ fix, not the hyphen rule. I regenerated them: 4/4 passed first draft, 4 calls, log in `data/generated/card-run-log.run3-regen.json`. Now the newest card for every one of the 21 issues passes against the current evidence (17 salesperson + 4 manager), and so does the stress-test card's template text.
- Still open from Shubh's review (not in this pass): the privacy decision on names in public evidence; `amTop` letting ₹0 role models take alert slots; low-repeat new customers counted over ~335 days but divided by 365; the "last on roster" step value (47) vs its display ("14 Sep"); the loader header saying "no names".

## Naman UI fields - 21 Nov 2026 (draft_origin, reason)
- **New optional fields (all old fields kept):** `ActionCard.draft_origin?: "gemini" | "injected_test"`, mirrored as `CardValidation.draft_origin?`, and `ScorecardRow.reason?: string`. 123 tests pass; `next build` passes.
- **draft_origin:** `"injected_test"` on the stress-test card, `"gemini"` when the text or a rejected draft came from Gemini, unset on pure templates. The cards table has no column for it, so it lives in `cards.validation.draft_origin`. I backfilled all 29 stored rows: 27 gemini, 1 injected_test, 1 unset. Helpers in `engine/card-origin.ts`: `originForCard`, `withDraftOrigin`, `draftOriginOf`, `toCardRow`. Sample `cards.json`: card-1's illustrative rejected draft is now labelled `injected_test` (text starts "Injected test draft…"); card-2 is `gemini`.
  - FYI: 5 stored template cards carry a rejected Gemini draft. These are my run-1 fallbacks, caused by validator false alarms already fixed. They are older than the served cards, and none was a number error.
  - **@Shubh:** (1) in the card mapper, set `card.draft_origin = row.validation.draft_origin`; (2) in `makeCard`/`/api/run`, wrap new cards with `withDraftOrigin(card, originForCard(card))` and save with `toCardRow(card)` (otherwise the insert fails on the missing column); or add a `draft_origin` column in a migration if you prefer.
  - **@Sagnik:** show the "draft rejected" beat with the label "Stress test: injected draft (not written by Gemini)" whenever `draft_origin === "injected_test"`. Never call it a Gemini mistake.
- **reason:** one plain line on every `not_found` / `data_issue` row, in `data/generated/scorecard.json` and `data/sample/scorecard.json`. Not-found rows state the bar the detector applies, plus computed notes. Example: "LKO-02: the drop is there, but a sharper cause explains it… MYS-02: conversion 8.31% → 6.79%, 0.79 pts worse than peers, under the 1-point bar, not statistically significant (z 1.57); dropped." Data-issue rows quote their dq_flags. Every row has `kind`.
  - **@Shubh:** there is no scorecard table, so nothing to upsert. The reasons need the raw data, so they can't be rebuilt on Vercel. Have `/api/scorecard` take `kind` and `reason` (and `store_rupees_at_stake`, `market_rupees_at_stake`, `biggest_issue_id`) from the committed `data/generated/scorecard.json`, matched by `type`. Or add a `scorecard` table and I'll upsert it from `npm run load`.
  - **@Sagnik:** show `reason` under each not-found / data-issue row; use `kind` for the store total and the market-note label.


## Shubh demo-backend checkpoint - 21 Nov 2026, 14:30 IST
- Live: https://blueberry-chromosome.vercel.app (deploy `8aacbe8` READY, 0 errors in the last 100 log lines). Every route 200 with `"source": "db"`; `/api/scorecard` has all 13 rows; `NEXT_PUBLIC_USE_SAMPLE` is 0 in Production and Preview.
- **Card by id is live:** `GET /api/card?id=<card id>` or `POST /api/card {card_id}` returns the full stored card (text, source, validation incl. rejected_numbers, rejected_draft). Unknown id -> 404 `{ error }`; both `card_id` and `issue_id` -> 400. Stress card: `/api/card?id=stress-test:2026-10-31:PAT-01:discount_above_norm:SP1064:salesperson` (stored as `source: "template"`, `passed: false`, rejected `18%`, `₹40,000`).
- **Manager cards are live:** 4 `am` cards pre-generated with Gemini, all passed the validator (KNP-01 city_slowdown, LKO-02 staff_absent_or_left, BLR-03 understaffed_busy_days, BLR-01 role_model), 4 Gemini calls. Naman's 18 salesperson cards and the stress card untouched (29 cards total). Script: `supabase/scripts/pregen-manager-cards.ts` (saves only validated Gemini cards, call budget, paced).
- **Speed:** functions now run in Tokyo (`hnd1`, next to Supabase) instead of Virginia. Every card (5 salesperson, 4 manager, stress) returns from the DB in 0.31-0.41 s; scorecard 0.45 s, brief 0.58 s (were ~2 s).
- `/api/card` for an issue: saved card first. A salesperson request falls back to the manager card when only that exists (so LKO-02 and BLR-03 load from the DB even though the UI asks for `salesperson`); a manager request never gets a seller's own card.
- README: real results (21 issues, top findings with ₹, 18/18 cards, 37 drafts clean, 7 false alarms fixed), synthetic-data note, stress card explained as a team-written test. "650 stores" removed (unverified).
- **@Sagnik:** open the stress card with `getCard` by id via `GET /api/card?id=...` and label it "Stress test: injected draft". For LKO-02, BLR-03 and BLR-01 role_model you will receive `audience: "am"` cards; showing them as manager cards (not in the salesperson phone frame) would match the content.
- **@Naman:** nothing needed from you for the backend. Note `/api/run` (cron 06:00 IST tomorrow) would generate fresh cards that shadow today's stored ones; harmless after the demo.

## Sagnik real-data QA checkpoint — 21 Nov 2026
- Done: live home and AM-01 through AM-06 checked in fresh browser contexts at 390 px and 1440 px. All 13 home rows and every manager evidence disclosure opened and closed; no horizontal overflow. AM-04 and AM-06 show a clear no-issues message; AM-02 shows one alert and a market note.
- Done: all 18 recorded real Gemini cards from data/generated/card-run-log.json rendered locally with NEXT_PUBLIC_USE_SAMPLE=0, using browser-intercepted recorded responses. Desktop and phone screenshots captured and reviewed. Every card passed validation, fit the layout and had no rejection replay. Baseline build passed; Impeccable detector returned [].
- Pending: live stored-card sweep and stress replay await Shubh’s read-only GET /api/card?id route. Automatic approval review rejected a bulk production POST sweep because cache misses could generate cards, incur cost or write data. No bulk production POST requests were sent.
- Next: market-note/store-total distinction, reasons, card provenance and audience corrections, synthetic-data disclosure, fresh two-click judge run and demo script. Engine wording/number corrections remain with Naman.
