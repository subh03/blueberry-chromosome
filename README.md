# Store Coach

Store Coach tells each Manyavar area manager which stores need attention this week, why, and how many rupees are at stake.
It also gives each salesperson one thing to do better today.
Our own code computes every number on screen from the store data, and you can tap any number to see its formula.

**Live:** https://blueberry-chromosome.vercel.app
**Built at:** Vibe Coders Hackathon Edition 3 (Calcutta AI Club), 21 Nov 2026, on Manyavar's Store Coach problem statement.
**Data:** synthetic data supplied by the hackathon organisers for this problem statement, not real Manyavar customer or staff records.

## Who it is for

### Area managers

They look after several stores and read at most five alerts a week.
Today they usually hear about a problem after sales have already fallen.
They need four things: which store, why, how much money, and what to do this week.

### Salespeople

There are 175 of them across 20 stores, and they work on a phone on the shop floor.
"Improve conversion" is not something they can act on.
They need one behaviour to change today, shown against a colleague in the same store who already does it well.

## What it does

1. **The brief checklist (home page).**
   One table, one row per problem the brief asks us to find: a good salesperson has left, too few people on the floor on busy days, walk-ins steady but fewer buying, a whole city slowing down, the obvious pair not added, discounts above the store's norm, and role models to copy.
   Each row says whether we found it, in which stores, and the rupees at stake.
   Tap a row and the evidence chain opens: metric, baseline, peer, gap, rupees at stake, cause, each with its formula and row count.
2. **The area manager's weekly brief (`/am/AM-01`).**
   At most five issues per manager, sorted by rupees at stake.
   Each issue has a lever, a cause, one action (who, what, when) and a rupee value.
   A slowdown that hits a whole city becomes a market note for the manager, not an alert against one store.
3. **The salesperson's action card (`/cards/...`).**
   A card of 60 words or fewer, shown in a phone frame: one behaviour, a peer from the same store, one action for today.
   Gemini writes the words; our code checks every number in them (see below).

A daily run (Vercel cron at 06:00 IST) regenerates the cards from the stored evidence and records what happened in a run log, which the home page shows.

### Results on the hackathon dataset

The engine reproduces the fleet baseline, checked against an independent pandas script:

| Metric | Formula | Fleet value |
|---|---|---|
| Conversion | bills ÷ footfall × 100 | 12.95% |
| Items per bill | non-packaging quantity ÷ bills | 1.96 |

`npm run check:baseline` flags LKO-02 (conversion 12.61% in May-Jul, 11.01% in the last 28 days) and BLR-03 (staff presence 80.1% down to 76.5%).

As of 31 Oct 2026 the detectors find 21 issues across the 20 stores: 20 store and salesperson alerts worth ₹7,60,100 over 28 days, and one city-wide market note.
The brief checklist has 13 rows: 8 problems found, 1 not found (walk-ins steady but fewer buying), and 4 data issues that are shown but never alerted.
The biggest store problems:

| Store | Problem | ₹ at stake (28 days) | Cause, as the engine writes it |
|---|---|---|---|
| LKO-02 | a good salesperson has left | ₹3,22,400 | the top seller (23.3% of bills) has not been on the roster since 14 Sep; conversion fell from 12.6% to 10.4% |
| BLR-03 | too few people on busy days | ₹1,99,600 | fewer people on the floor on Saturdays and Sundays (7.4 down to 6.6); weekend conversion fell from 13.0% to 9.8% |
| BLR-02 | a category the city buys is avoided | ₹53,800 | one seller sells Indo-Western on 1.3% of bills, against 8.1% in the rest of Bengaluru |

The other 17 issues are salesperson-level: missing pairs (4), discounts above the store's norm (3), low repeat customers (9) and one role model to copy.
All 3 Kanpur stores also lost walk-ins against the rest of the fleet in the last 28 days (KNP-01 down 19.3%, KNP-02 down 18.4%, KNP-03 down 16.1%), against 2.1% down in the same weeks last year.
The engine puts that at ₹6,18,300, but it is a market note for the area manager, not a store alert, so it is not in the ₹7,60,100.

Cards (model `gemini-3.1-flash-lite`, 8 s deadline):

- 18 of 18 salesperson cards were written by Gemini and passed the validator (17 on the first draft, 1 after a retry).
- Across two full runs, Gemini wrote 37 drafts and none of them used a number outside the evidence.
- The validator raised 7 false alarms in those runs (for example it read "Kurta Sets" and "Currently," as names); all 7 are fixed and covered by tests.
- The 4 area-manager cards are also Gemini-written and validated, and every card is stored, so the demo never waits on a live Gemini call.

## How the numbers are made

All metrics are computed in TypeScript in `engine/` and run by `npm run load` on our own laptops.
The loader reads the raw CSVs, computes store and salesperson metrics over three windows (last 28 days, May-Jul 2026 baseline, all time), and writes only aggregates to Supabase.
No customer IDs leave the laptop.
On the first full load it read 388,618 rows.

"Today" in the data is the close of 31 Oct 2026, and every window counts back from that date.
A store is compared with its own May-Jul baseline and with the median of same-city stores of the same tier.

Some numbers in the data are wrong, so they are shown as data issues and never sent to a manager as alerts:

- 84,001 packaging lines (bags and covers billed at ₹0) are left out of items per bill and discount.
- PAT-03 has 11 store-days with more bills than walk-ins; those days are left out of conversion.
- BLR-05 opened on 10 Oct 2026, so it has no baseline yet and is shown as "too new to judge".
- Staff with no exit date are treated as having left only after 21 days with no roster day and no bill, and the card says "not on roster since <date>", never "resigned".
- Three days either side of Diwali (20 Oct 2025) are left out of baselines.

## How Gemini is used, and checked

Gemini never computes anything.
It gets one `Evidence` object per issue (the steps, the cause, the peer, and an `allowedNumbers` list of every number it may mention, exactly as displayed) and returns the card text as structured JSON.

Then our code checks the draft:

- A validator (`engine/card-validator.ts`) rejects the card if it uses a number that is not in `allowedNumbers` (after normalising formats, so 18% and 18 % match), names a person who is not in the evidence, names no peer, has no action or no "today"/"by", or runs over 60 words.
- A rejected draft is retried once.
- If the second draft also fails, Gemini takes longer than 8 seconds, or the call errors, the card falls back to a template filled only from the evidence, so the screen always has a card.
- The card records its `source` (`gemini` or `template`), and a rejected draft is kept so the UI can show exactly which number was invented.

The model is `gemini-3.1-flash-lite`, called from `app/api/_lib/gemini.ts`; the prompt is `engine/card-prompt.ts`.
Cards are generated ahead of time and stored, and `/api/card` serves the stored card first.

Gemini never made a number up in our runs, so there is no real mistake to show.
To prove the validator works, the team wrote one bad draft by hand and stored it as a stress-test card (id `stress-test:2026-10-31:PAT-01:discount_above_norm:SP1064:salesperson`).
Its draft starts with "Injected test draft (written by the team, not by Gemini):", the validator rejects its two invented numbers (18% and ₹40,000), and the template card is shown instead.
It is a team-written test, not a Gemini mistake, and the app and the demo video must call it a stress test.

## Tech stack

- Next.js 16 (App Router, route handlers), React 19, Tailwind CSS 4, shadcn/ui
- Supabase (Postgres) with row-level security: the browser key can only read, writes use the service role on the server
- Gemini API (`gemini-3.1-flash-lite`) over REST with structured JSON output
- Vercel for hosting, with a Vercel cron for the daily run
- TypeScript everywhere, including the metrics engine; tests run with Node's built-in test runner through `tsx`

## API

The other read routes try Supabase first and fall back to `data/sample/*.json` only when the table is empty or the read fails.
Each response carries `"source"` (`db`, `sample` or `generated`), so you can always tell where the data came from.

| Route | Reads |
|---|---|
| `GET /api/scorecard` | `data/generated/scorecard.json`, written by the same `npm run load` that fills `issues`; returns each row's `kind` and `reason`, the store and market totals, and `"source": "generated"` |
| `GET /api/issues` | `issues` (evidence is stored inside each issue) |
| `GET /api/brief?am=AM-01` | `area_managers` + `issues` |
| `GET /api/dq-flags` | `dq_flags` |
| `GET /api/run-log` | `runs` |
| `POST /api/card` `{ issue_id, audience? }` | the stored card for an issue; if there is none, Gemini or the template |
| `GET /api/card?id=…` or `POST /api/card` `{ card_id }` | one stored card by id (for example the stress-test card); unknown id returns 404 |
| `GET`/`POST /api/run` | writes `runs` and `cards`; needs `Authorization: Bearer <CRON_SECRET>` |

The schema is in `supabase/migrations/`, and `supabase/README-DB.md` says how to re-create it.

## Run it locally

You need Node 20 or newer.

```bash
git clone https://github.com/subh03/blueberry-chromosome.git
cd blueberry-chromosome
npm ci
NEXT_PUBLIC_USE_SAMPLE=1 npm run dev
```

Open http://localhost:3000.
With `NEXT_PUBLIC_USE_SAMPLE=1` and no `.env.local`, the pages and the API run on the sample files in `data/sample/`, so you need no keys at all.

### About the company data

Manyavar's dataset is not in this repository and never will be.
The loader expects it in `local-data/` (set by `LOCAL_DATA_DIR`), which is gitignored.
Without it you cannot run `npm run load` or `npm run check:baseline`, but everything else works on the sample data.

To run against a real Supabase project, copy `.env.example` to `.env.local` and fill it in:

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | read-only access from the pages and API |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side writes only (`/api/run`, the loader); never sent to the browser |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_TIMEOUT_MS` | the action cards (`AI_TIMEOUT_MS=8000`) |
| `CRON_SECRET` | protects `/api/run` |
| `LOCAL_DATA_DIR` | where the loader finds the CSVs (local only) |
| `NEXT_PUBLIC_USE_SAMPLE` | `1` = pages read the sample files instead of the API |

Useful commands:

```bash
npm test                       # engine tests
npx tsx --test lib/db/*.test.ts app/api/_lib/*.test.ts   # database and API helper tests
npm run check:baseline         # needs local-data/: prints fleet conversion and items per bill
npm run load                   # needs local-data/ and the service role key: fills Supabase
npm run build
```

## Team

- Naman Kejriwal (lead): metrics engine, detectors, the Gemini prompt and validator, data contract, demo video
- Shubh: Supabase schema and security, API routes, Gemini call and fallback, cron, Vercel deploys
- Sagnik Bhowmick: the interface: brief checklist, evidence chain, manager brief, phone card, design system

## Open items

- Whether Vercel's hobby plan fires the 06:00 cron reliably is not yet confirmed; `POST /api/run` triggers the same run by hand.
