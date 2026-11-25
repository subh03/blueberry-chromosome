# PLAN: Manyavar Store Coach

> TL;DR: Every morning our code reads 2 years of store data, finds the store problems the brief describes, puts a rupee value on each and proves it with evidence. Gemini then turns each problem into a short action card. Gemini only writes the words, and code rejects any card that has a number the evidence does not have.
> Tracer bullet live on Vercel by **12:00**. Hour-1 number check by **11:45**. Freeze **15:30**. Video up **16:15**. Submit **16:30**.

---

## 1. Product, demo, wow

**One line:** Store Coach tells each Manyavar area manager which stores need attention this week, and why, with a rupee value. It also gives each salesperson one thing to do better today. Every number has a source.

**User + pain:** Area managers have 4 stores each, read at most 5 alerts a week, and learn about problems only after sales fall. Salespeople get "improve conversion", which they can't act on.

**"Today" in the data = close of 31 Oct 2026.** Every window is counted back from that date.

### The wow visual: "Brief checklist" scorecard
The home page is one table. Each row is a problem type the brief tells us to find. Each row shows whether we found it, where, and a status chip.

```
BRIEF CHECKLIST                              FOUND   WHERE
More bills   · good salesperson left/absent   ✔      LKO-02   ₹ at stake →
More bills   · too few on floor, busy days    ✔      BLR-03   →
More bills   · city slowing (market issue)    ✔/—    …        →
Baskets      · missing obvious pair           ✔      …        →
Baskets      · discount above store norm      ✔      KNP-03   →
Repeat       · role model to copy             ✔      …        →
Not a problem· data issue (not alerted)       ⚠ 4    PAT-03, BLR-05 …
```
Click a row and the **evidence chain** opens: metric → baseline → peer → gap → ₹ at stake → cause, each with its formula. The chain ends in a **phone frame** that shows the action card the salesperson would get.
We do NOT claim to know Manyavar's hidden answers. The rows are the brief's own problem list, so judges can tick them off.

### 2-minute demo script (5 beats)
1. **0:00-0:20 Hook.** "31 Oct, 7 am. Nobody asked a question. At 6 am Store Coach checked 20 stores and 175 salespeople." Show the run log line (time, rows read, issues, cards).
2. **0:20-0:50 Scorecard.** The brief's checklist with ✔ on each row. Point at the data-issue row: "PAT-03 had more bills than walk-ins on 11 days, so we flagged a data issue and did not alert the manager. BLR-05 opened 10 Oct, so we don't compare it yet."
3. **0:50-1:20 Evidence chain (LKO-02).** Conversion and basket size are both down against the store's own baseline and its Lucknow peers. The cause is named, with ₹ at stake. Hover any number to see its formula and row count.
4. **1:20-1:45 Phone card.** A salesperson card of 60 words or fewer: one behaviour, a peer from the same store, one action today. Then a side panel shows Gemini's first draft, which **had an invented number. Rejected. Template used.** That is the trust beat.
5. **1:45-2:00 Follow-up + close.** "A week later": the engine re-run as of 24 Oct vs 31 Oct shows whether the number moved. Close: "Runs daily, no login. It plugs into VFL's systems as a layer for 650 stores."

---

## 2. Features (max 4, in build order)

| # | Feature | Brain (owner) | Face (owner) | Cut order |
|---|---|---|---|---|
| F1 | **Metrics + problem engine** | Naman: `engine/` metrics, detectors, ₹ at stake, data-quality guard | Sagnik: scorecard + evidence chain | never |
| F2 | **Area-manager weekly brief** (≤5 issues, ranked by ₹) | Naman: ranking. Shubh: `/api/brief`, Supabase reads | Sagnik: `/am/[amId]` page | never |
| F3 | **Salesperson action card** (Gemini + number validator + template fallback) | Naman: prompt, validator, templates. Shubh: `/api/card` with timeout | Sagnik: phone-frame card | cut Gemini, keep templates (last resort) |
| F4 | **Runs on its own + follow-up** (Vercel cron, run log, week-later check) | Shubh: cron + run log. Naman: as-of-24-Oct vs 31-Oct compare | Sagnik: run-log strip, "moved?" badge | **cut first** (keep the run log only) |

**Done when**
- F1: `npm run check:baseline` prints fleet conversion **12.95%** and items/bill **1.96**. LKO-02 and BLR-03 each come up as an issue with a named cause. PAT-03 and BLR-05 come up as data-quality flags, not alerts.
- F2: each AM gets ≤5 issues. Each issue has a lever, a cause, one action (who/what/when) and ₹ at stake. The list is sorted by ₹ and loads in under 2 s on a phone.
- F3: the card has ≤60 words and names a same-store peer. Every number in it appears in `evidence.allowedNumbers`. If Gemini goes over the 8 s timeout or fails the validator, the template card shows instead and the screen is never blank.
- F4: `/api/run` (cron) writes a `runs` row. The home page shows "Last run 06:00, N issues". Each issue shows ↑/↓/= since 24 Oct.

### Metric definitions (code only; the LLM never computes)
| Metric | Formula | Notes |
|---|---|---|
| Conversion | bills ÷ footfall × 100 | fleet all-time = **12.95%** ✔ (checked 11:20 with pandas) |
| Items per bill (IPB) | Σ qty of non-packaging lines ÷ bills | fleet = **1.96** ✔. Packaging (`is_packaging=1`, 84,001 lines) excluded |
| Discount % | Σ (mrp − selling_price) × qty ÷ Σ mrp × qty | non-packaging only |
| Repeat rate | customers with another bill 30+ days after their first ÷ customers | per store / salesperson, first bills in window |
| Pair attach | sherwani bills that also have safa/mojari/mala ÷ sherwani bills; kurta bills with a jacket ÷ kurta bills | |
| Presence | Present ÷ roster rows | roster only covers 1 May-31 Oct 2026 |
| ₹ at stake (28 days) | conversion gap: (peer conv − store conv) × footfall × avg bill value. IPB gap: (peer IPB − store IPB) × bills × avg unit price. Discount: (store disc − norm) × MRP sales | gap floors at 0. Peer = median of same-city stores of the same tier, falling back to the same-state median |

**Windows:** current = last 28 days (4-31 Oct 2026). Baseline = the store's own May-Jul 2026 plus its same-city peers in the current window. Days within ±3 of a calendar festival (Diwali 2025-10-20) are excluded from baselines.

### Detectors (P1 must ship; P2 only if time)
P1: `staff_absent_or_left` · `understaffed_busy_days` · `conversion_drop_footfall_steady` · `city_slowdown` (one note for the AM, no store alerts) · `missing_pair` · `discount_above_norm`.
P2: `category_avoidance` · `low_repeat` / `role_model`.

---

## 3. TRACER BULLET (live by 12:00, ugly is fine)
local CSV → `npm run load` computes **fleet + LKO-02 conversion** → upserts into `store_metrics` → `/api/card` sends one evidence JSON to Gemini → the validator passes it, or the template is used → `app/page.tsx` shows the number + the card → **live Vercel URL**.
- 11:20-11:30 Naman: `create-next-app` + Tailwind + shadcn init, `types/`, `data/sample/`, `.env.example`. Push.
- 11:30-11:50 Shubh: Supabase project + migration `0001_init.sql`, Vercel project + env vars, `/api/card` stub. Naman: `scripts/load.ts` (one metric). Sagnik: home page from `data/sample/`.
- 11:50-12:00 Shubh deploys. Everyone opens the URL on a phone in incognito.

## 4. HOUR-1 CHECK (cut-off 11:45). Owner: **Naman**
- Command: `npm run check:baseline` (`scripts/check-baseline.ts`). It reads `LOCAL_DATA_DIR` and prints fleet conversion, IPB, the per-store table and the flags.
- It must assert: conversion **12.95%**, IPB **1.96**. **LKO-02** is flagged (conversion 12.61→11.01, IPB 2.13→1.87, May-Jul vs Aug-Oct). **BLR-03** is flagged (conversion 13.00→11.39, presence 80.1%→76.5%). PAT-03 has 11 store-days with bills > footfall and becomes a DQ flag. BLR-05 (opened 2026-10-10) is excluded.
- Other leads to confirm or drop: discount jumps at **KNP-03** (0.1%→1.1%) and **PAT-01** (1.6%→2.4%), and **MYS-02**'s conversion drop (8.3→6.8). These came from a probe that has not been verified yet.
- A pandas cross-check already matched both fleet numbers at 11:20. The TS engine must give the same values.
- **If it doesn't match: stop UI work on the evidence chain, fix the definitions, ask the Manyavar mentor in the room.**

## 5. Handshake contract (exists now)
- `types/index.ts`: `StoreMetrics`, `SalespersonMetrics`, `Issue`, `Evidence`, `EvidenceStep`, `ActionCard`, `DataQualityFlag`, `ScorecardRow`, `RunLog`, `AmBrief`.
- `data/sample/*.json` uses exactly those shapes. Sagnik builds every screen from these files from minute one. `NEXT_PUBLIC_USE_SAMPLE=1` switches the UI from the API to the sample files.
- Changing a type: ask Naman. He edits `types/`, updates the samples and posts in chat.

## 6. Folders + Git
| Owner | Folders |
|---|---|
| **Naman** | `types/` `data/sample/` `engine/` `scripts/` `tests/` `package.json` `.env.example` root configs, `PLAN.md` `DECISIONS.md` |
| **Shubh** | `supabase/` (migrations, seed) `lib/db/` `app/api/` `vercel.json` |
| **Sagnik** | `app/` (everything except `app/api/`) `components/` `lib/ui/` `public/` |
| everyone | append-only to `PROGRESS.md` |

Git rules: `git pull --rebase` before every work block. Commit small, every 20-30 min. Never force-push. Never commit `.env.local`, keys or `local-data/` (check `git status` before `git add`; never `git add -A` blindly). Need a dependency? Ask Naman to add it to `package.json`.

## 7. Supabase, what runs where, env
**Tables** (`supabase/migrations/0001_init.sql`, RLS on, anon = read-only):
- `stores` (store_id pk, city, state, tier, opened_on, area_manager_id)
- `area_managers` (area_manager_id pk, name, city, max_alerts_per_week)
- `store_metrics` (store_id, as_of, window, conversion, ipb, discount_pct, repeat_rate, footfall, bills, avg_bill_value, pk(store_id, as_of, window))
- `salesperson_metrics` (salesperson_id, store_id, as_of, display_name, conversion_proxy, ipb, discount_pct, repeat_rate, presence, pair_attach, last_active)
- `issues` (id pk, as_of, store_id, area_manager_id, lever, type, rupees_at_stake, cause, action jsonb, evidence jsonb, rank, followup jsonb)
- `cards` (id pk, issue_id, audience 'am'|'salesperson', salesperson_id, text, source 'gemini'|'template', validator jsonb, created_at)
- `dq_flags` (id, store_id, kind, detail, rows_affected)
- `runs` (id pk, started_at, finished_at, trigger 'cron'|'manual'|'load', rows_read, issues, cards, gemini_ok, gemini_fallback, ok, error)

**What runs where**
- **Local only (never on Vercel):** `npm run load` reads `local-data/…/csv`, computes all metrics, issues, DQ flags and evidence, and upserts only **aggregates** (no customer IDs) to Supabase with the service key. Run it from the repo root on Shubh's or Naman's Mac: `npm run load`. One run fills the shared DB.
- **Vercel:** pages read Supabase with the anon key. `/api/card` calls Gemini (8 s timeout → template). `/api/run` (cron 06:00 IST = `30 0 * * *` UTC, protected by `CRON_SECRET`) regenerates cards from the stored evidence and writes `runs`. Honest pitch line: in production the loader is the nightly ETL.
- Seed: `supabase/seed.sql` is a fallback snapshot exported after the first good load, so the demo works even if nobody reruns the load.

**`.env.example`** (names only): `NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY` `SUPABASE_SERVICE_ROLE_KEY` `GEMINI_API_KEY` `GEMINI_MODEL` `AI_TIMEOUT_MS` `CRON_SECRET` `LOCAL_DATA_DIR` `NEXT_PUBLIC_USE_SAMPLE`
**Vercel env:** everything except `LOCAL_DATA_DIR`. `NEXT_PUBLIC_USE_SAMPLE=0`. `SUPABASE_SERVICE_ROLE_KEY` only if `/api/run` writes (it does).

## 8. Hour by hour
| Time | Naman | Shubh | Sagnik |
|---|---|---|---|
| 11:20-12:00 | scaffold, contract, load.ts, **check:baseline by 11:45** | Supabase + migration, Vercel, `/api/card` stub, **deploy** | home page + scorecard from samples |
| 12:00-13:00 | P1 detectors + ₹ at stake + DQ guard; tests on the definitions | `/api/brief`, `/api/store/[id]`, `/api/scorecard`; seed export | evidence chain, AM brief page |
| 13:00-13:20 | lunch at desk | lunch | lunch |
| 13:20-14:20 | Gemini prompt, validator, templates, salesperson cards | `/api/card` real (timeout, retry once, fallback), `cards` table | phone-frame card, loading/fallback states, mobile |
| 14:20-15:00 | follow-up (as-of 24 Oct vs 31 Oct), P2 detectors if green | cron `/api/run`, `runs` log, incognito/phone test | run-log strip, "moved?" badge, empty/error states |
| 15:00-15:30 | integration pass, fix wrong numbers first | env check on Vercel, prod smoke test | polish against DESIGN.md |
| **15:30 FREEZE** | demo script dry run, record 15:40-16:00 | fix only demo-blocking bugs | fix only demo-blocking bugs, README |
| 16:00-16:15 | edit + upload video (Loom/unlisted YouTube) | final deploy, link check | final checklist run |
| 16:30 | **submit** (Naman, captain): repo, link, video, one-liner | | |

## 9. Works-without-help checklist + data-quality guard
- [ ] No login. The home page shows the scorecard immediately. One hint line: "Tap any row to see the evidence."
- [ ] Data seeded in Supabase. The first screen is never empty. `seed.sql` is the fallback.
- [ ] The main flow takes 2 taps: row → evidence → phone card.
- [ ] Every AI call has a skeleton loader, an 8 s timeout and a template fallback. No raw errors.
- [ ] Works at 375 px and in incognito. No localhost URLs. Every Vercel env var is set.
- [ ] Every number on screen has a tooltip with its formula + row count.

**Data-quality guard** (in `engine/dq.ts`; DQ flags never become AM alerts):
- Packaging rows (`is_packaging=1`) are excluded from IPB, discount and category metrics.
- Store-days with bills > footfall (PAT-03, 11 days) are flagged as a data issue, and those days are left out of conversion.
- New store BLR-05 (opened 2026-10-10) has no baseline, so we show "too new to judge" and skip peer medians.
- Staff who left (no exit date): last active = last Present roster day or last bill. No activity for 21+ days after being active means "inferred left". The card says "not on roster since <date>", never "resigned".
- Diwali dip: ±3 days around 2025-10-20 are excluded from baselines. A dip that hits every store in a city at once becomes `city_slowdown` (market), not a store alert.

## 10. Risks + 20-minute rule (stuck 20 min → do the backup)
| Risk | Backup after 20 min |
|---|---|
| TS numbers don't match 12.95 / 1.96 | use the pandas definitions verbatim; ask the mentor |
| Supabase or RLS blocks reads | load also writes `data/generated/*.json` (aggregates only, no customer IDs, safe to commit); API routes read those files instead |
| Gemini slow, failing or quota out | templates only; show "AI draft unavailable, template used" |
| Vercel build or env failure | redeploy the last green commit; check env names against `.env.example` |
| Cron won't fire on the hobby plan | "Run now" button calls `/api/run`; the run log still shows a time |
| A detector finds nothing for LKO-02 or BLR-03 | inspect per-salesperson presence/bills for that store; hard-check the definition, never hard-code the result |
| Video recording fails | screen-record with QuickTime, cut in iMovie, keep under 2:00 |

## 11. Self-check
Can 3 people, each with AI writing the code, finish F1-F3 by 15:30 and keep 30-45 min for polish? **Yes, if scope stays as cut below.**
Cut now: P2 detectors become "only if green at 14:20". Hindi cards: later only. F4 is reduced to the run log + a computed week-later compare (no real scheduler dependency). No chat box, no WhatsApp, no auth, no stock features.

### Later, only if time
Hindi card toggle · role-model leaderboard · category-avoidance detector · per-salesperson history sparkline.

---

## 12. v2 (25 Nov, after the hackathon, Naman, branch `v2-roles`): one screen per role

Why: a real area manager can't read a company-wide page every morning. Each role sees only what they can act on.

| Screen | Route | Shows | Never shows |
|---|---|---|---|
| Home | `/` | "Who are you?" picker (area manager, store manager, salesperson), one line on how it works, language switch. The phone remembers the choice; no login | company metrics (they moved to `/overview`) |
| Overview (proof) | `/overview` | the old home: ₹ at stake, problems, evidence chain, How we checked | |
| Area manager | `/am/[amId]` | the existing weekly brief (≤5) + **their stores vs city/state peers** (conversion, items per bill, days present, basket flag) | salesperson rows |
| Store manager | `/store/[storeId]` | today's 1-3 actions (checked card text), **team table** (days present, est. conversion, items per bill, customers back vs the store middle), role model, store vs peers | other stores |
| Salesperson | `/me/[spId]` | one action card + "My last 28 days" vs the store middle | other people's numbers |

Engine (`npm run team` → `data/generated/team.json`, `engine/team.ts`): store compare vs own May-Jul baseline and pooled city/state peers; **store basket check** (items per bill below both peers by ≥0.10 and below own baseline by ≥0.05; ₹ = gap × bills × average item value); team rows with **estimated** per-person conversion (footfall is per store: each day's walk-ins split across the people present). Standings are words + arrows, computed in code.

Languages: English, Hindi, Bengali on every role screen (`lib/ui/i18n.ts`, `?lang=hi|bn`). Card text comes from `npm run cards:translate` → `data/generated/card-translations.json`: Gemini translates the stored English card, code checks that every number is unchanged (Devanagari/Bengali digits normalised); a failed language falls back to English with a note.

Not doing in v2: a single 0-100 score (weights would be a guess and hide the cause), logins, the basket check as a card-generating detector (needs a DB re-load and card regen; next step).

### v2.1 (25 Nov): the same flow for every role
List of problems → tap one → **problem screen** `/problem/[id]`: (1) what is wrong, (2) how we know (button opens the evidence chain), (3) what to do, (4) the action card in the chosen language with Copy / Share on WhatsApp, and a link to the full checked card. Back returns to the role page it came from. The area manager page is rebuilt so it is fully translated (problems, market note, morning message, store table). Causes and actions are translated by `npm run issues:translate` with the same number check; failures show English.
