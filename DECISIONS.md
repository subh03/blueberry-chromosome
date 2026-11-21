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
- Scorecard rows = the **brief's own problem list**. We never claim to know Manyavar's hidden answers.

## AI
- Gemini writes words only, from an `Evidence` JSON. The validator rejects any number not in `allowedNumbers`, any card over 60 words, and any card with no peer named. Rejected → retry once → template. Timeout 8 s.

## Scope cuts (made at plan time)
- F4 (cron + follow-up) is first to cut. The follow-up is computed as as-of 24 Oct vs 31 Oct, not a real week later.
- P2 detectors (category avoidance, repeat/role model) only if green at 14:20.
- Not doing: Hindi cards (later), chat box, WhatsApp sending, auth, stock features.
