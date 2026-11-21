# Demo video: voice-over script (max 2:00)

Read at a calm pace, about 140 words a minute.
Lines in `[[ ]]` are placeholders: fill them from the live app on recording day and read only what the screen shows.
Never say a number that is not on screen at that moment.

## 0:00-0:20 Hook

**Screen:** home page, run log line in view.

> It's 31 October, 7 am, and nobody has asked Store Coach a question yet.
> At 6 it already went through 20 Manyavar stores and 175 salespeople.
> The run log says what it read and what it found: [[TBD: rows read, issues, cards, from the latest run]].

## 0:20-0:50 The brief checklist

**Screen:** scorecard table; move the cursor down the rows, stop on the data-issue rows.

> This is the brief's own problem list, one row each.
> A good seller who left, too few people on busy days, a whole city slowing down, the missing pair, discounts above the norm.
> For each one: did we find it, where, and how much money is at stake.
> These two rows are not alerts.
> PAT-03 had more bills than walk-ins on 11 days, which can't be right, so we flag the data and leave the manager alone.
> BLR-05 only opened on 10 October, so we don't judge it yet.

## 0:50-1:20 Evidence chain

**Screen:** click the top row ([[TBD: top store, expected LKO-02]]); the evidence chain opens; hover one number to show its formula.

> Open the top row.
> LKO-02's conversion went from 12.61% in May to July down to 11.01% in the last four weeks.
> [[TBD: second step from the detector, e.g. items per bill or presence, as shown]].
> The cause, in plain words: [[TBD: cause text from the issue]].
> At stake over 28 days: [[TBD: ₹ value]].
> Hover any number and you get its formula and how many rows sit behind it.

## 1:20-1:45 The card, and the trust beat

**Screen:** phone frame with the salesperson card; then the side panel with the rejected draft.

> This is what the salesperson gets on their phone.
> One behaviour, one colleague from the same store who already does it, one thing to try today.
> Gemini wrote the words.
> Here is its first draft: it used a number the evidence doesn't have.
> Our code rejected it, and the template card went out instead.
> [[TBD: confirm the validator is wired and this rejection is real before recording; otherwise cut the three lines from "Gemini wrote the words" and say "Every number on the card comes from the evidence, checked by code."]]

## 1:45-2:00 Follow-up and close

**Screen:** the "moved?" badge on an issue, then back to the home page.

> A week later we check whether the number moved: [[TBD: follow-up display, e.g. "11.0% to 11.4%", or cut this line if F4 is cut]].
> It runs every morning, with no login.
> It can sit on top of Manyavar's existing systems for all [[to verify: 650]] stores.

---

The fixed lines come to about 260 words, which leaves room for pauses.
Before recording: open https://blueberry-chromosome.vercel.app in incognito and check that `/api/scorecard` says `"source": "db"`, so the video shows real data and not the sample.
