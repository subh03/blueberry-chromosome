# DESIGN: Store Coach

> TL;DR: **The auditor's ledger.** Ivory paper, bottle-green ink, a brass thread for the evidence, and one loud thing on each screen: the rupee. Dense, quiet, every number can be traced. This extends what Sagnik already built (`app/globals.css`); it does not replace it.

Mode: **Operate** (a work tool). Precision and restraint beat expression. Brand lives in the details: the brass thread, the tabular rupee, the stamp.

---

## 1. Concept

One sentence: *A store auditor's ledger: you see the problem list, you pull one thread, and the evidence unspools to a card a salesperson can act on today.*

- The **scorecard** is the ledger page (a real table, not cards).
- The **evidence chain** is the thread (a brass vertical rule joining each step).
- The **phone card** is the slip handed to the shop floor, with the auditor's stamp when AI got it wrong.

## 2. Colour

Kept from Sagnik's CSS (already in use) plus three named additions. No blue, no violet, no gradients.

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F7F7F5` | page background (neutral, not cream) |
| `--surface` | `#FFFFFF` | table, panels, phone screen |
| `--ink` | `#252B28` | body text |
| `--ink-muted` | `#526055` | secondary text, formulas (6.3:1 on paper) |
| `--rule` | `#DCE0DB` | hairlines, table rows |
| `--green` | `#244E3B` | primary: links, buttons, brand |
| `--green-deep` | `#183B2D` | button hover/press, headings on tint |
| `--green-tint` | `#E8EDE8` | table head, follow-up box, selected row |
| `--brass` | `#75562C` | **rupee figures**, the evidence thread, focus ring |
| `--brass-tint` | `#F5EAD3` | trust beat (AI rejected) background |
| `--brass-ink` | `#6D4C17` | text on brass tint |
| `--madder` | `#A23B2A` | **new.** Down deltas (↓) and the rejected number only. Never a fill, never a badge. |
| `--dq` | `#EEEEE6` | data-quality strip (neutral, so it never reads as an alert) |

Rules
- The rupee is brass, always. Nothing else on the page is brass except the thread and focus ring.
- Red is rare: one underline on the invented number, ↓ arrows. "Urgent" red badges are banned.
- Status chips are text + a 6 px dot, not filled pills: Found (green dot), Data issue (olive `#8A8F6A` dot), Not found (rule-grey ring).

## 3. Type

**IBM Plex Sans** (one family) via `next/font/google`, plus **IBM Plex Sans Condensed** for figures, **IBM Plex Mono** for formulas only. Chosen because Plex has a Devanagari sibling for the later Hindi cards and clean tabular numerals.

```ts
// app/layout.tsx (Sagnik)
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed, IBM_Plex_Mono } from "next/font/google";
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const cond = IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-figure", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-mono", display: "swap" });
// <html className={`${sans.variable} ${cond.variable} ${mono.variable}`}>
```
Fallbacks: `var(--font-sans), system-ui, "Segoe UI", Arial, sans-serif` · mono: `ui-monospace, Consolas, monospace`. If ₹ is missing from a subset, the system fallback draws it; check once on Windows.

| Role | Size / weight / leading | Notes |
|---|---|---|
| h1 | 40 px (clamp 30-44) / 600 / 1.15 | tracking -0.02em. One per page. |
| h2 | 22 px / 600 / 1.3 | |
| h3 | 18 px / 600 / 1.35 | |
| Body | 16 px / 400 / 1.55 | measure ≤ 72ch |
| Table | 15 px / 400 | rows 56 px desktop |
| Small / meta | 13 px / 400, `--ink-muted` | never below 12 px |
| **Rupee hero figure** | Condensed 600, 56 px desktop / 40 px phone | `font-variant-numeric: tabular-nums`, brass |
| Table figures | Condensed 500, 17 px, tabular, right-aligned | |
| Formula | Mono 13 px, `--ink-muted` | only for real formulas (`bills ÷ footfall × 100`) |

Rupees: always `toLocaleString("en-IN")` → `₹4,82,300`. Lakh shorthand (`₹4.8 L`) only in table cells, with the full value in the tooltip. Sentence case everywhere. No all-caps labels.

## 4. Layout

- Shell: `.coach-shell` max 1160 px, 32 px side gutter desktop, **16 px at ≤ 640 px**. Left-aligned. No centred hero.
- Spacing scale (dense): 4, 8, 12, 16, 24, 32, 48. More space above a heading than below.
- Radius: 6 px on buttons/inputs, 10 px on panels, 40 px on the phone frame. No pills except the status dot.
- Elevation: borders only. The one shadow is the phone frame (`0 18px 40px -20px rgb(24 59 45 / .35)`).

```
HOME (≥ 1024)                                      PHONE (375)
┌──────────────────────────────────────────────┐   ┌─────────────────────┐
│ Manyavar Store Coach        Weekly brief     │   │ Store Coach    Brief │
│──────────────────────────────────────────────│   │─────────────────────│
│ ₹ 18,42,000   at stake across 6 problems     │   │ ₹18,42,000          │
│ 20 stores, 175 staff, last run 06:00 31 Oct  │   │ at stake, 6 problems│
│──────────────────────────────────────────────│   │─────────────────────│
│ Problem from the brief   Store   ₹     Status│   │ Good salesperson    │
│ Good salesperson left    LKO-02  4.8 L  ● Found   │ left, LKO-02        │
│  ┃ conversion 11.01% … (evidence, inline)    │   │ ₹4.8 L   ● Found    │
│ Too few on floor         BLR-03  …     ● Found│   │ ...                 │
│ Data issue (not alerted) PAT-03  —     ● Data │   │                     │
└──────────────────────────────────────────────┘   └─────────────────────┘
```
(The figures above are layout placeholders; real values come from the engine.)

- Scorecard stays a `<table>`; at ≤ 640 px rows become a 3-column grid (Sagnik's CSS already does this).
- Evidence opens **inline under its row** (not a modal, not a new page).
- Card page: phone frame 360 px left, audit column right; stacks phone-first at ≤ 700 px.

## 5. Components

**Button.** Primary: `--green` fill, white text, 6 px radius, 44 px min height, 16 px 500. Hover `--green-deep`; press `scale(.98)` 120 ms. Secondary: 1 px `--green` border, green text. One pair only. Labels are verb + object ("Open action card", "Try again"). No `→` glued to labels.

**Table row (scorecard).** Full-row button, 56 px. Hover (fine pointer only): `--green-tint` background, 120 ms. Expanded row: 3 px brass left border. Figures right-aligned, tabular.

**Number with source.** Every figure is a `<button>` or `<abbr>` with a tooltip: formula (mono), rows used, window. Dotted brass underline (1 px, offset 3 px) marks "this has a source". Tap on phone opens the same text in a small popover.

**Evidence step.** Grid: label (muted 13 px) / value (Condensed 20 px) / comparison line / formula (mono 13 px). Steps joined by a 2 px `--brass` vertical rule on the left with a 7 px brass node per step. The last step (₹ at stake) uses the brass figure style.

**Status.** 6 px dot + word. Never colour alone.

**Input/select** (AM picker). 44 px, 1 px `--rule` border, 6 px radius, focus ring 3 px `--brass` offset 2 px. Visible label above.

**Nav.** Masthead: brand left ("Manyavar Store Coach"), one link right ("Weekly brief"). No sidebar, no hamburger needed at 375.

**States**
- Loading: skeleton rows in `--green-tint` at the real row height (no spinner), plus a text line `role="status"` ("Reading 20 stores…").
- AI loading on the card: the template text shows faded (opacity .45) with "Gemini is drafting (up to 8 s)". Never a blank phone.
- Empty: say what happened and what to do ("No problems for this week. The last run was 06:00, 31 Oct.").
- Error: plain sentence + "Try again" button. No stack traces, no "Oops".
- Data issue: neutral `--dq` strip, olive dot, "Not alerted: data mismatch on 11 days". Never red.

## 6. Motion

One family. CSS only (plus a tiny rAF count-up). `transform` and `opacity` only. No Lenis, no scroll-linked or pinned sections, no fade-in on scroll: this is a tool people reload all day.

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--t-press: 120ms;  --t-quick: 180ms;  --t-panel: 240ms;  --t-count: 900ms;
```

Micro: button press `scale(.98)` 120 ms; row hover background 120 ms; tooltip fade + 4 px rise 150 ms from its trigger; evidence panel open = opacity + `translateY(-4px → 0)` 240 ms. Hover effects inside `@media (hover: hover) and (pointer: fine)`.

### The 3 signature moments

**1. Scorecard + rupee count-up** (home, first load once per session)

| Element | Role | Starts | Duration | Motion | Relationship |
|---|---|---|---|---|---|
| Total ₹ at stake | Lead | 0 | 900 ms | count 0 → value, `--ease-out` on the value; tabular nums so width never jumps | — |
| Table rows | Support | 0 | 240 ms | opacity + 6 px rise, delays 0/40/70/90/105/115 ms (shrinking gaps) | overlaps the count |
| Row ₹ cells | Support | lands with its row | — | no count, already final | together with row |
| Status dots | Decoration | with row | — | none | carried by row |

The final value is in the HTML (and `aria-label`) from the start; the count is cosmetic. Rows are clickable the moment they're visible. Do not replay on back-navigation (sessionStorage flag, wrapped in try/catch).

**2. Evidence chain** (on row expand; happens often, so it stays under 300 ms)

| Element | Role | Starts | Duration | Motion |
|---|---|---|---|---|
| Panel | Lead | 0 | 240 ms | opacity + `translateY(-4px)` |
| Brass thread | Support | 40 ms | 260 ms | `scaleY(0 → 1)`, origin top |
| Steps (metric → baseline → peer → gap → ₹ → cause) | Support | 40, 80, 110, 135, 155, 170 ms | 200 ms | opacity + 4 px rise |

Order carries meaning (metric before ₹), so it overlaps rather than appearing at once. Closing: everything goes together, 150 ms, no reverse stagger. Re-opening the same row within a session: no stagger, panel only.

**3. Phone card: "AI draft rejected, template used"** (card page, when `source === "template"` after a validator rejection; seen rarely, so it gets room)

| Element | Role | Starts | Duration | Motion |
|---|---|---|---|---|
| Gemini draft in the phone | Lead | 0 | 240 ms | fade in |
| Invented number | Support | 500 ms | 200 ms | madder underline draws (`scaleX` 0 → 1, origin left) |
| Stamp "Rejected: 18% is not in the evidence" | Lead | 800 ms | 220 ms | opacity + `scale(1.04 → 1)`, brass-ink on brass-tint, 2° tilt fixed (no animation of tilt) |
| Template card | Lead | 1300 ms | 300 ms | crossfade over the draft (draft out, template in, same box) |
| Footer line "Template used. Every number checked." | Support | 1450 ms | 200 ms | fade |
| Audit column (validator JSON) | Static | — | — | already there |

A "Replay" text button under the phone reruns it (interrupts cleanly: cancel running animations first). The audit column also shows the draft as text, so the beat is readable without motion. (The "18%" is an example; use the real rejected token from the validator.)

**Reduced motion:** no count (final value), no stagger, no thread draw. Moment 3 shows the end state: template card in the phone, the rejected draft with its underline and stamp shown statically beside it.

## 7. Never

- Kicker / eyebrow label above a heading.
- Gradient text, gradient washes, glass as decoration, glow.
- Blue primary, purple, violet, lavender anywhere.
- Identical icon-card grids; a row of four KPI tiles; donut charts; sparklines as filler.
- Italic serif display headline. All-caps labels. Tracking tighter than -0.04em (use -0.02em).
- `→` appended to link/button text; meta strings stitched with ` · ` in new UI (use separate cells or commas).
- Emoji as icons. Red "urgent" badges. A modal for the evidence.
- `transition: all`, `ease-in` on UI, animating width/height/top/left, fade-in on scroll, scroll-jacking.
- Any number not from the engine, including in placeholder copy shipped to prod.
- A spinner on its own. A blank phone frame. A raw error.

## 8. Handoff to Sagnik (owner of `app/`, `components/`)

1. Add the three `next/font` imports in `app/layout.tsx`; point `--font-sans` at Plex and drop the `"Segoe UI"` root override.
2. Add the tokens in §2 and §6 to `:root` in `globals.css`; replace raw hex in classes with tokens (values already match).
3. Build the total ₹ line above the table + count-up (moment 1).
4. Brass thread + step stagger in `evidence-chain.tsx` (moment 2).
5. Stamp sequence in `phone-card.tsx` (moment 3). Then remove `→` from link labels.
