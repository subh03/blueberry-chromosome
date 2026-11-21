# PROGRESS

**Live link:** (none yet; target live by 12:00)
**Repo:** github.com/subh03/blueberry-chromosome

## Done
- 11:20 Plan + handshake contract (`PLAN.md`, `types/index.ts`, `data/sample/*.json`, `.env.example`). Naman
- 11:20 Fleet numbers cross-checked in pandas: conversion 12.95%, items/bill 1.96 ✔. Naman
- `npm run check:baseline` green in TS: conversion 12.95% PASS, IPB 1.96 PASS, LKO-02 flagged (conversion 12.61→11.01), BLR-03 flagged (presence 80.1→76.5). DQ: 84,001 packaging lines, PAT-03 11 store-days bills>footfall (all zero/missing footfall), BLR-05 too new, 43 inferred leavers, Diwali 2025 bills −8%. Leads: KNP-03 + PAT-01 discount HOLD, MYS-02 DROP. Engine in `engine/` (metrics, compare, dq, csv, data), 8 tests via `npm test`. Naman

## In progress
- Naman: `scripts/load.ts` (reuse `engine/`), then P1 detectors + ₹ at stake
- Shubh: Supabase project + `0001_init.sql`, Vercel project + env, `/api/card` stub, deploy by 12:00
- Sagnik: home scorecard from `data/sample/scorecard.json`

## Broken
- (none)

## Next
- 12:00 tracer bullet live on a phone in incognito
