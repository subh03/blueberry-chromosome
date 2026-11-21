# DECISIONS

## Statement
- **Store Coach (Manyavar).** The idea was finalised by the team. (Pre-event /hack-pick had ranked Vinayak > Lumino > Store Coach; we went with Store Coach because its dataset makes "real work behind the first screen" provable.)

## Stack
- Next.js + Tailwind + shadcn, Supabase, Gemini, Vercel (from HACKATHON.md).
- **Engine in TypeScript** (`engine/`, run with tsx), so the engine and the UI share `types/`. pandas was used only as an independent cross-check of the fleet numbers.

## Data and numbers
- Datasets stay in `local-data/` (gitignored). `npm run load` runs locally and writes **aggregates only** to Supabase (no customer IDs).
- Definitions (checked 11:20 against the raw CSVs):
  - Conversion = bills ÷ footfall × 100 → fleet **12.95%**
  - Items per bill = non-packaging qty ÷ bills → fleet **1.96**
- "Today" = 2026-10-31. Current window = last 28 days. Baseline = the store's May-Jul 2026 + same-city peers.
- DQ guard: packaging excluded. PAT-03 has 11 days with bills > footfall (data issue). BLR-05 is too new. Leavers are inferred after 21+ days inactive. Diwali ±3 days are left out of baselines.
- **Peer flag rule (check:baseline):** May-Jul vs Aug-Oct 2026. A store is flagged on a metric only if its change minus the peer change is past the bar vs BOTH same-city and same-state peers (pooled, excluding itself and stores opened after 1 May). Bars: conversion −1.0 pp, IPB −0.15, presence −2.0 pp, discount +0.5 pp. Conversion uses clean days only (bills > footfall days dropped).
- **Manyavar mentor answers (21 Nov, ~12:00):**
  - Family members count as separate walk-ins, so conversion = bills ÷ footfall stays as is.
  - Bills come from separate billing software, not the door camera. Bills > walk-ins means the two systems don't match, so it stays a data issue and never an alert.
  - No sale for 3 weeks is **normal** for a salesperson. So "no sales" alone must never mean "left" or "under-performing".
  - So the leaver rule is: **left = roster rows stop** (no Present or Off rows after the last Present day). Someone still on the roster but marked Off counts as absent, not left. Implemented as `rosterLeavers` in `engine/dq.ts` (gap 21 days). Result: 9 left (BLR-02 2, BLR-03 2, BLR-04 1, KNP-03 1, LKO-01 1, LKO-02 1, PAT-04 1), 0 absent, 35 never on the May-Oct roster (left before it starts). 2 of the 9 had some Off days after their last Present day, but their roster rows also stop 21+ days before 31 Oct, so they count as left.
- **Loader rows (`engine/rows.ts`):** conversion in store_metrics uses clean days only; IPB/discount use all bills. Repeat rate = customers whose fleet-wide first bill is in the window and 30+ days before as-of, who billed again 30+ days later; attributed to the first bill's store/salesperson; null under 30 customers. So `current_28d` repeat is always null and `baseline_mayjul` repeat (~1%) is short-follow-up — use `all_time` repeat for detectors. salesperson_metrics window = Aug-Oct 2026; includes staff active since 1 May; `inferred_left` uses `rosterLeavers`. presence is null for `all_time`.
- Scorecard rows = the **brief's own problem list**. We never claim to know Manyavar's hidden answers.

## Detectors (Naman, 21 Nov, F1)
- **Windows:** before = the 3 calendar months before the last 3 (May-Jul 2026); after = Aug-Oct 2026. ₹ inputs use the last 28 days. Salesperson habits (pairs, categories) use the last 12 months; discounts use Aug-Oct; repeat uses all time (fleet **7.6%**: customers whose first bill is 30+ days before as-of; 7.3% if recent customers are counted too).
- **Fair comparison:** a store is flagged on conversion only if its change minus the peer change is ≤ −1.0 pt vs BOTH same-city and same-state peers (pooled, no new stores), AND its own drop is real (two-proportion z ≥ 2). ₹ uses the smaller of the two gaps. Salespeople are compared with the rest of their own store (pairs, discount, repeat) or their city (category mix, so regional taste is respected).
- **₹ at stake (28 days):** conversion issues = gap ÷ 100 × walk-ins (last 28 days, clean days) × average bill value; all three are evidence steps. Rate levers = gap ÷ 100 × bills (or customers, or MRP value) per 28 days × ₹ per unit. Role models get ₹0: they are upside and appear as the peer on low-repeat cards.
- **One conversion issue per store** (most specific wins: understaffed > left/missed shifts > generic drop), so ₹ is never counted twice. A city with a slowdown gets no store conversion alerts.
- **Top seller who left:** roster stops 21+ days before as-of, bill share ≥ 1.3× an even split and rank 1-2 in the 90 days before. "Before" is May-Jul when they left after July (the 8 weeks before leaving already held a weak August at LKO-02 and hid a 1.65-pt gap).
- **Missing pair:** exact binomial lower tail ≤ 0.001 and gap ≥ 5 pts (the normal approximation gave a false hit on small sherwani counts).
- **Names in evidence:** first name + initial (as the synthetic data gives them) appear in `issues.evidence` / `cause` / `action`, because the brief says to name role models and peers. No customer IDs anywhere. `data/generated/*.json` follows the same rule.
- **Leads checked and dropped:**
  - **MYS-02** conversion 8.31→6.79: gap vs state peers only −0.79 pts and z 1.57 (not significant on ~90 bills a month). Dropped.
  - **KNP-03** discount 0.1→1.1%: tiny volume (42-74 lines per seller in Aug-Oct), still under the state norm, no seller ≥ 2× the rest of the store. Dropped.
  - **PAT-01** discount: holds, but at salesperson level: two sellers give 6-7% off MRP vs ~1% for the rest of the store (54-60% of their lines discounted).
  - **BLR-01** conversion 14.23→12.82: gap −0.86 pts, just under the bar. Not alerted.
  - Most all-time repeat "role models" (24.9%, 22.6%, ...) left before May 2026 (not on the roster), so they are not named; only active ones are.
- **Diwali check on real data:** run as of 31 Oct 2025 (Diwali 20 Oct inside the window): no city slowdown and no Diwali-driven store alerts.

## Cards (Naman, 21 Nov, F3)
- Validator: a bare decimal never matches a percentage (3.1 ≠ 3.1%); no rounding (8% ≠ 8.2%); ₹/Rs/k/lakh are the same number; "one" is not counted (too common: "one thing"); two and up, years and clock times are. Peer rule applies only when the evidence has a peer (store-wide cards have none).
- Prompt: action first, say when ("today", "this Saturday and Sunday"), no clock times, numbers copied exactly from allowedNumbers, no closing benefit line.
- Honesty: Gemini made no number mistakes in 37 real drafts, so the trust beat uses one labelled stress-test card with a team-written draft. Never presented as a Gemini error.

## Follow-up (Naman, 21 Nov, F4)
- "A week later" = the detectors re-run as of 2026-10-24 on the same data, rules and guards, compared with 2026-10-31. Matching key = store + type + salesperson (the issue id without its date).
- Each issue follows its own headline metric (conversion; weekend conversion; walk-ins vs fleet; pair rate; category share; discount off MRP; repeat rate), read from the same evidence step on both dates.
- Direction uses the values as displayed (1 decimal): equal displays = "flat" (FLAT_TOLERANCE 0.05). `improved` = moved the good way (discount: down); flat is not improved.
- Honest limits: these metrics use long windows (Aug-Oct, last 12 months, all-time repeat), so a week moves them only a little, and the move says nothing about whether the action worked. The text only says the number moved or did not move.

## AI
- Gemini writes words only, from an `Evidence` JSON. The validator rejects any number not in `allowedNumbers`, any card over 60 words, and any card with no peer named. Rejected → retry once → template. Timeout 8 s.

## Scope cuts (made at plan time)
- F4 (cron + follow-up) is first to cut. The follow-up is computed as as-of 24 Oct vs 31 Oct, not a real week later.
- P2 detectors (category avoidance, repeat/role model) only if green at 14:20.
- Not doing: Hindi cards (later), chat box, WhatsApp sending, auth, stock features.

## Backend (Shubh)
- Evidence is stored inside `issues.evidence` (jsonb), not as its own table, so an issue and its numbers are always written together.
- `salesperson_metrics` is server-only (no anon access). Pages read names only through `Evidence`.
- The browser uses the Supabase publishable key (`sb_publishable_...`) in `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Writes only use the service role, on the server.
- Vercel project lives under the `blueberrychromosome-1281` account, Git-linked to `subh03/blueberry-chromosome`.

## Design
- **DESIGN.md: "the auditor's ledger"** (21 Nov). Ivory paper `#F7F7F5`, bottle green `#244E3B`, brass `#75562C` for every rupee figure and the evidence thread, madder `#A23B2A` only for ↓ and the rejected number. IBM Plex Sans / Sans Condensed (figures) / Mono (formulas) via next/font. Extends Sagnik's existing CSS, no blue, no gradients. No Lenis or scroll animation (work tool); 3 moments: rupee count-up, evidence thread, "AI draft rejected" stamp.
- 21 Nov ~15:00 (Naman): the validator now checks meaning, not only numbers (`engine/card-semantics.ts`). Manager cards get Issue.action word for word plus a facts block. Gemini manager drafts that pass but read oddly may be hand-edited by the team; the original stays in `validation.team_edit.gemini_text` and the edit must pass the same validator.
- 21 Nov (Naman, branch `ux-overhaul`): **DESIGN.md v2 "the morning walk-through"** replaces the ledger look on a branch, merged only if clearly better. Deep teal `#083F39`/`#0D5C53` structure, marigold `#F3B23A` for money and the main action, red/amber/green severity chips computed from ₹ at stake (High ≥ ₹1,00,000, Medium ≥ ₹40,000). Bricolage Grotesque headings + IBM Plex Sans body. Home is static (reads `data/generated/*.json` at build time, no loading screen); the 13-row checklist, data set aside and "Cards checked: 29, all passed" move into a collapsed "How we checked". Run log ("0 Gemini cards") no longer shown on the page.
- 21 Nov ~15:25 (Naman, persona audit): **a card must say its issue's action.** `Evidence.action` (optional) mirrors `Issue.action`, so the prompt and the validator always get it, on every path (`/api/card` included, no route change). New check `actionCheck`: ≥80% of the action's content words must appear in the card (names ignored; "Store team" cards for a manager-owned action are exempt). The peer is someone to ask, never the action. Follow-up flat/up/down is read from the displayed 1-decimal values. The ₹ step label now states its basis ("₹ at stake per 28 days, based on the last 28 days of walk-ins / new customers / bills / MRP sales"); no ₹ value changed (pinned in a test).
