# Store Coach

Store Coach tells each Manyavar area manager which stores need attention this week, why, and how many rupees are at stake.
It also gives each salesperson one thing to do better today.
Our own code computes every number on screen from the store data, and you can tap any number to see its formula.

**Live:** https://blueberry-chromosome.vercel.app
**Built at:** Vibe Coders Hackathon Edition 3 (Calcutta AI Club), 21 Nov 2026, on Manyavar's Store Coach problem statement.

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

### Results on Manyavar's data

The engine already reproduces the fleet baseline, checked against an independent pandas script:

| Metric | Formula | Fleet value |
|---|---|---|
| Conversion | bills ÷ footfall × 100 | 12.95% |
| Items per bill | non-packaging quantity ÷ bills | 1.96 |

`npm run check:baseline` flags LKO-02 (conversion 12.61% in May-Jul, 11.01% in the last 28 days) and BLR-03 (staff presence 80.1% down to 76.5%).

The detectors are not finished yet, so these lines are placeholders until the engine fills them:

- Issues found across the 20 stores: **[[TBD: number of issues from the detectors]]**
- Total rupees at stake (28 days): **[[TBD: ₹ total from the engine]]**
- Top issue and its cause: **[[TBD: store, type, cause]]**
- Cards generated in the last run, and how many came from Gemini vs the template: **[[TBD: from the runs table]]**

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

- A validator rejects the card if it contains any number that is not in `allowedNumbers`, if it is longer than 60 words, or if it names no peer.
- A rejected draft is retried once.
- If the second draft also fails, Gemini takes longer than 8 seconds, or the call errors, the card falls back to a template written from the issue's own action and cause, so the screen always has a card.
- The card records its `source` (`gemini` or `template`), and a rejected draft is kept so the UI can show exactly which number was invented.

The model is `gemini-3.1-flash-lite`, called from `app/api/_lib/gemini.ts`.
Status: the Gemini call, the timeout, the retry and the template fallback are live.
**[[TBD: the prompt and the number validator are being finished in `engine/`; until they are wired into `app/api/_lib/make-card.ts`, every card is the template.]]**

## Tech stack

- Next.js 16 (App Router, route handlers), React 19, Tailwind CSS 4, shadcn/ui
- Supabase (Postgres) with row-level security: the browser key can only read, writes use the service role on the server
- Gemini API (`gemini-3.1-flash-lite`) over REST with structured JSON output
- Vercel for hosting, with a Vercel cron for the daily run
- TypeScript everywhere, including the metrics engine; tests run with Node's built-in test runner through `tsx`

## API

Every read route tries Supabase first and falls back to `data/sample/*.json` only when the table is empty or the read fails.
The response carries `"source": "db"` or `"source": "sample"`, so you can always tell which one you are looking at.

| Route | Reads |
|---|---|
| `GET /api/scorecard` | `issues` + `dq_flags` |
| `GET /api/issues` | `issues` (evidence is stored inside each issue) |
| `GET /api/brief?am=AM-01` | `area_managers` + `issues` |
| `GET /api/dq-flags` | `dq_flags` |
| `GET /api/run-log` | `runs` |
| `POST /api/card` | one issue, then Gemini or the template |
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

- Detector results and rupee totals above: Naman, before the 15:30 freeze.
- Prompt and number validator wired into `/api/card`: Naman.
- Whether Vercel's hobby plan fires the 06:00 cron reliably is not yet confirmed; `POST /api/run` triggers the same run by hand.
