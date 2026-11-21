# PRODUCT: Manyavar Store Coach

**What it is.** Every morning, code reads two years of Manyavar store data, finds the store problems the brief names, puts a rupee value on each and shows the evidence. Gemini only turns each problem into a short action card. Code rejects any card with a number the evidence does not have.

**Who uses it**
- **Area managers** (4 stores each, read at most 5 alerts a week). Laptop, between store visits. They need: which store, why, how much money, what to do this week.
- **Salespeople** (175 across 20 stores). Phone, on the shop floor. They need: one thing to do better today, named against a colleague in the same store.
- **Judges and Manyavar mentors** (demo). They need to tick the brief's problem list off and trust every number.

**Brand tone.** A good store auditor: calm, exact, a bit formal, never alarmed. Says "not on roster since 3 Oct", never "resigned". Shows the formula before the claim. Indian retail context: rupees in lakh/crore grouping (`en-IN`), store codes like LKO-02, festive wear, not tech.

**What it must feel like.** A ledger you can trust. Dense, quiet, readable in a bright store. Craft cues from Manyavar's world (ivory, deep green, brass thread), not from SaaS.

**Anti-references (do not look like)**
- Generic SaaS dashboard: blue primary, KPI tiles in a row of four, donut charts.
- AI product pages: purple/violet gradients, gradient text, glowing glass cards, sparkle icons.
- Wedding-site kitsch: maroon-and-gold ornament, mandala borders, script fonts.
- Notification spam: red badges everywhere, "URGENT" banners.

**Hard product rules (from PLAN.md / CLAUDE.md)**
- Every number is computed in code and has a formula + row count on hover/tap.
- Every AI call: loading state, 8 s timeout, template fallback. No blank screens, no raw errors.
- No login. Works at 375 px and in incognito. No real WhatsApp/SMS sending.
- Data issues (PAT-03, BLR-05) are shown as data issues, never as alerts.
