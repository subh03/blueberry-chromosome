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
- Scorecard rows = the **brief's own problem list**. We never claim to know Manyavar's hidden answers.

## AI
- Gemini writes words only, from an `Evidence` JSON. The validator rejects any number not in `allowedNumbers`, any card over 60 words, and any card with no peer named. Rejected → retry once → template. Timeout 8 s.

## Scope cuts (made at plan time)
- F4 (cron + follow-up) is first to cut. The follow-up is computed as as-of 24 Oct vs 31 Oct, not a real week later.
- P2 detectors (category avoidance, repeat/role model) only if green at 14:20.
- Not doing: Hindi cards (later), chat box, WhatsApp sending, auth, stock features.
