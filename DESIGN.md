# DESIGN: Store Coach (v2, UX overhaul)

> TL;DR: **The morning walk-through.** Deep teal ink for structure, one marigold accent for money and the main action, clear red / amber / green severity. A judge understands the page in 5 seconds: what it does, how much is at stake, which problem is biggest, what to do today. The proof lives one click deeper and in "How we checked" at the bottom.

Mode: **Operate**, with a short Persuade hero on the home page. Replaces the v1 "auditor's ledger" look (table-first, brass, tiny text).

## 1. Concept
*Store Coach walks a store manager through the morning: here is what is wrong, here is the proof, here is the one thing to do today.*

Reading order on home: hero (sentence + ₹ at stake + one button) → How it works (Find, Prove, Act) → Top problems (ranked cards with ₹ bars) → Market note (calm banner, outside the total) → How we checked (collapsed).

## 2. Colour
| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F4F6F5` | page background (cool, not cream) |
| `--surface` | `#FFFFFF` | cards, panels, phone screen |
| `--ink` | `#0F2422` | body text, headings |
| `--ink-2` | `#45524F` | secondary text (7.4:1 on paper) |
| `--rule` | `#D5DDDA` | borders, hairlines |
| `--teal` | `#0D5C53` | structure: hero band, links, secondary buttons, focus ring |
| `--teal-deep` | `#083F39` | hero band ground, hover on teal |
| `--teal-tint` | `#E2EEEB` | selected card, market note ground |
| `--marigold` | `#F3B23A` | **₹ figures on dark, ₹ bars, primary button fill** (ink text on it, 9.9:1) |
| `--marigold-ink` | `#8A5300` | marigold-family text on light (6.0:1 on white) |
| `--high` / `--high-bg` | `#A3271C` / `#FCE8E5` | severity chip: High |
| `--mid` / `--mid-bg` | `#8A4B00` / `#FDF0D3` | severity chip: Medium |
| `--low` / `--low-bg` | `#1F6B3B` / `#E2F3E8` | severity chip: Low, role model |

Rules
- Marigold means money or the main action. Nothing else is marigold.
- Severity is computed in code from ₹ at stake (High ≥ ₹1,00,000, Medium ≥ ₹40,000, else Low) and always shown as a word, never colour alone.
- Red appears only in High chips and the rejected number on the stress-test card. No red banners.

## 3. Type
- **Bricolage Grotesque** (600, 700) for headings and the hero ₹. **IBM Plex Sans** (400, 500, 600) for body and every other number (tabular numerals, ₹ glyph, Devanagari sibling for later Hindi cards).
- Scale (px, mobile → desktop): hero ₹ 56 → 104 · h1 32 → 52 · h2 26 → 36 · h3 20 → 22 · body 17 → 18 · small 15 · minimum 14.
- Line height 1.55 body, 1.1 headings. Tracking −0.02em on headings, never tighter than −0.03em. Measure ≤ 70ch.

## 4. Layout
- Container `min(1120px, 100% − 32px)`. 4 px spacing base; sections separated by 72–112 px, groups by 16–24 px.
- Sticky header (56 px): wordmark, Overview, Weekly brief, How we checked.
- Problem cards: one column, full width, ranked. Severity chip + store tag on top, plain line, ₹ figure right, proportional ₹ bar under, arrow icon. The evidence panel opens inline under the chosen card.
- Phone frame for the action card, max 380 px wide; trust line under it.
- 390 px: everything one column, buttons full width, no horizontal scroll.

## 5. Components
- **Buttons:** primary (marigold fill, ink text), secondary (teal outline), ghost (teal text). All 44 px min height, 8 px radius, hover darkens, active scale 0.98, `:focus-visible` 3 px teal ring with 3 px offset.
- **Card:** white, 14 px radius, 1 px rule border, no resting shadow. Hover: lift 2 px + soft shadow. Selected: teal border + teal-tint ground.
- **Chips:** 14 px text, 4 px 10 px padding, pill radius, word + colour.
- **States:** server-rendered first paint (no "Loading" screen on home). Card page: skeleton phone frame while the card is made, 10 s timeout, template fallback from the API, retry button on error.

## 6. Motion (one easing family)
- Ease-out `cubic-bezier(0.23, 1, 0.32, 1)`. Press 120 ms, hover 180 ms, panel 240 ms, bars 700 ms, count-up 900 ms.
- Signature moments: (1) hero ₹ counts up once per session; (2) ₹ bars grow (scaleX) staggered 60 ms when the list first enters view; (3) evidence panel opens (opacity + 8 px rise, steps staggered 40 ms).
- Hover lift on cards, press scale on buttons. Transform and opacity only.
- `prefers-reduced-motion`: no count-up, bars at full width, no lift, panel appears instantly. Content is never hidden waiting for an animation.

## 7. Honesty labels (must stay visible)
- "Synthetic data supplied by the organisers" in the hero subline and the footer.
- Kanpur city slowdown: its own banner labelled **Market note**, outside the store total.
- Stress-test card: "Stress test: injected draft, not written by Gemini"; the rejection sequence only when `rejected_draft` exists.
- Say "at stake", never "saved" or "lost". No claim of measured improvement.

## 8. Never
No eyebrow/kicker above headings, no gradient text, no glass, no identical icon-card walls, no coloured border-left callouts, no all-caps labels, no monospace costume, no blue or violet, no "0 cards" run stats on the page, no fade-in on every section, no italic serif display.
