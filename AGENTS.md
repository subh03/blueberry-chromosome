# Team rules: Store Coach (VCH3, Manyavar)

CLAUDE.md and AGENTS.md are identical. If you change one, copy the change to the other (Naman only).

## Team and roles
- **Naman** (Mac, Claude Code Ultra, lead + captain): `engine/` metrics + detectors + AI step, `scripts/`, `tests/`, `types/`, `data/sample/`, `package.json`, `.env.example`, demo video, submission.
- **Shubh** (Mac, Claude Code Pro): `supabase/`, `lib/db/`, `app/api/`, `vercel.json`. Owns deploys and Vercel env.
- **Sagnik** (Windows, Codex): `app/` pages (not `app/api/`), `components/`, `lib/ui/`, `public/`. Builds from `data/sample/` until the API is ready (`NEXT_PUBLIC_USE_SAMPLE=1`).
- Shared files (`types/`, `package.json`, `.env.example`): **Naman only.** Ask in chat.

## Before anything
1. `git pull --rebase`
2. Read `PLAN.md`, `PROGRESS.md`, `DECISIONS.md`, and `DESIGN.md` if it exists.
3. Give a 3-line summary: what's done, what you're doing, what's blocked.

## While working
- Touch only your own folders. Follow `types/index.ts` exactly. If a shape is wrong, ask Naman; don't fork it.
- **Every number is computed in our code.** Gemini only writes words from an `Evidence` JSON. The validator rejects any card with a number not in `evidence.allowedNumbers`. Wrong numbers cost more than missing features.
- Every AI call has a loading state, an 8 s timeout and a template fallback. No blank screens, no raw errors.
- No login wall. No real WhatsApp/SMS sending. Works on a phone (375 px) and in incognito.
- Follow DESIGN.md once it exists. Work in small steps. Run it or test it before saying "done".
- `local-data/` holds Manyavar's data. **Never commit it, never paste personal rows into chat or code.** Only aggregates go to Supabase or `data/`.
- Stuck 20 minutes → take the backup in PLAN.md §10 and tell the team.

## Before finishing a chat
- `git status` (no `.env*`, no `local-data/`), commit small, `git pull --rebase`, `git push`. Never force-push.
- Update `PROGRESS.md` (your line) and `DECISIONS.md` if you decided something.
- Say in one line what the next chat should do.

## How to talk
- TL;DR first. Max 5 bullets. One next step.
- Plain words. No walls of text.

## Secrets
- `.env.local` stays local. Only `.env.example` (names, no values) is committed.
- Service role key: server routes and the local loader only, never in client code.

## Key commands
- `npm run dev`: local app
- `npm run load`: read `local-data/` CSVs, compute everything, upsert aggregates to Supabase (Mac, repo root)
- `npm run check:baseline`: must print conversion 12.95% and items/bill 1.96, and flag LKO-02 + BLR-03
- `npm test`: engine tests
