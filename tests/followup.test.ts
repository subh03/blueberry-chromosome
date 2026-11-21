// One-week follow-up: "a week later, check whether the number moved, and say so" (Store Coach brief).
import { test } from "node:test";
import assert from "node:assert/strict";
import { attachFollowups, followupFor, headline, NEW_THIS_WEEK } from "../engine/followup";
import { detectAll } from "../engine/detectors";
import { buildWorld, isWeekend, sellers, type StoreSpec } from "./fixtures/world";
import type { Issue } from "../types";

const step = (label: string, value: number, display: string) => ({ label, value, display, formula: "f", rows: 1 });
const mk = (asOf: string, type: string, steps: ReturnType<typeof step>[], suffix = ""): Issue => ({
  id: `${asOf}:S1:${type}${suffix}`, as_of: asOf, store_id: "S1", area_manager_id: "AM", lever: "more_bills", type, rupees_at_stake: 1, rank: 1,
  cause: "c", action: { who: "w", what: "x", when: "today" }, followup: null,
  evidence: { store_id: "S1", as_of: asOf, lever: "more_bills", type, steps, cause: "c", peer: null, allowedNumbers: [] },
} as unknown as Issue);

// ---------- one issue ----------
test("conversion going down is 'down', not improved, and the text only says the number moved", () => {
  const f = followupFor(
    mk("2026-10-24", "staff_absent_or_left", [step("Conversion, since 15 Sep", 12.61, "12.6%")]),
    mk("2026-10-31", "staff_absent_or_left", [step("Conversion, since 15 Sep", 10.44, "10.4%")]),
  )!;
  assert.deepEqual({ ...f }, {
    metric: "conversion", before_as_of: "2026-10-24", before: 12.61, after_as_of: "2026-10-31", after: 10.44,
    direction: "down", improved: false, display: "Conversion 12.6% → 10.4% (down) since last week's alert.",
  });
});

test("a discount going down is 'down' and counts as improved", () => {
  const f = followupFor(
    mk("2026-10-24", "discount_above_norm", [step("A: discount off MRP, Aug-Oct 2026", 7.3, "7.3%")], ":SP1"),
    mk("2026-10-31", "discount_above_norm", [step("A: discount off MRP, Aug-Oct 2026", 7.06, "7.1%")], ":SP1"),
  )!;
  assert.equal(f.direction, "down");
  assert.equal(f.improved, true);
  assert.equal(f.display, "Discount off MRP 7.3% → 7.1% (down) since last week's alert.");
});

test("a change too small to show is 'flat', not improved, and says it did not move", () => {
  const f = followupFor(
    mk("2026-10-24", "low_repeat", [step("A: customers who came back, all time", 3.04, "3.0%")], ":SP1"),
    mk("2026-10-31", "low_repeat", [step("A: customers who came back, all time", 3.01, "3.0%")], ":SP1"),
  )!;
  assert.equal(f.direction, "flat");
  assert.equal(f.improved, false);
  assert.equal(f.display, "Repeat rate 3.0% → 3.0%: did not move since last week's alert.");
});

test("each issue type follows its own metric", () => {
  const cases: [string, ReturnType<typeof step>[], string][] = [
    ["understaffed_busy_days", [step("People on the floor, Sat and Sun", 6.6, "6.6"), step("Conversion (Sat and Sun), Aug-Oct 2026", 11.2, "11.2%")], "weekend conversion"],
    ["conversion_drop_footfall_steady", [step("Walk-ins per day vs city peers", 1, "+1.0%"), step("Conversion, Aug-Oct 2026", 9.5, "9.5%")], "conversion"],
    ["city_slowdown", [step("Knp stores compared", 3, "3"), step("Knp walk-ins vs the rest of the fleet, last 28 days", -20.1, "−20.1%")], "walk-ins vs the rest of the fleet"],
    ["missing_pair", [step("A: Kurta Set bills with a jacket, last 12 months", 10.3, "10.3%")], "pair rate"],
    ["category_avoidance", [step("A: bills with Indo-Western, last 12 months", 1.3, "1.3%")], "category share"],
    ["role_model", [step("A: customers who came back, all time", 19.3, "19.3%")], "repeat rate"],
  ];
  for (const [type, steps, metric] of cases) assert.equal(headline(mk("2026-10-31", type, steps))?.metric, metric, type);
});

test("the follow-up text never claims the action caused the change", () => {
  for (const [b, a] of [[12.6, 10.4], [10.4, 12.6], [5, 5]]) {
    const f = followupFor(mk("2026-10-24", "conversion_drop_footfall_steady", [step("Conversion, x", b, `${b}%`)]), mk("2026-10-31", "conversion_drop_footfall_steady", [step("Conversion, x", a, `${a}%`)]))!;
    assert.doesNotMatch(f.display, /because|thanks to|due to|improved|worked|result of/i);
  }
});

// ---------- matching ----------
test("a follow-up is only set when the same store, type and salesperson was flagged a week earlier", () => {
  const prev = [mk("2026-10-24", "missing_pair", [step("A: Kurta Set bills with a jacket", 10, "10.0%")], ":SP1")];
  const cur = [
    mk("2026-10-31", "missing_pair", [step("A: Kurta Set bills with a jacket", 11, "11.0%")], ":SP1"),
    mk("2026-10-31", "missing_pair", [step("B: Kurta Set bills with a jacket", 9, "9.0%")], ":SP2"),
  ];
  const out = attachFollowups(cur, prev, "2026-10-24");
  assert.equal(out[0].followup?.direction, "up");
  assert.equal(out[0].followup?.improved, true);
  assert.equal(out[1].followup, null);
  assert.equal(out[1].followup_note, NEW_THIS_WEEK("2026-10-24"));
  assert.equal(out[1].evidence.followup_note, out[1].followup_note, "mirrored in evidence (stored as jsonb)");
  assert.equal(out[0].followup_note, undefined);
});

// ---------- the real engine on both dates ----------
function world(): ReturnType<typeof buildWorld> {
  const flat = (n: number) => () => n;
  const from = (d: string, a: number, b: number) => (x: string) => (x > d ? b : a);
  const s = (store_id: string, city: string, state: string, extra: Partial<StoreSpec> = {}): StoreSpec => ({
    store_id, city, state, area_manager_id: `AM-${city}`, footfall: flat(40), conv: flat(13), sellers: sellers(`${store_id}-`, 6), ...extra,
  });
  const diwali = "2026-10-28";
  const near = (d: string) => Math.abs(Date.parse(d) - Date.parse(diwali)) <= 3 * 86_400_000;
  return buildWorld({
    from: "2025-05-01", to: "2026-10-31", diwali: ["2025-10-20", diwali],
    stores: [
      // L1 dips hard on Diwali days only: must never be an issue on either date.
      s("L1", "Lko", "UP", { conv: (d) => (near(d) ? 1 : 13), footfall: (d) => (near(d) ? 120 : 40) }),
      s("L2", "Lko", "UP", { conv: from("2026-09-14", 13, 9.5), sellers: sellers("L2-", 6, [{ name: "Top S.", weight: 4, lastRoster: "2026-09-14" }]) }),
      s("L3", "Lko", "UP"),
      // L4: the discounter stops discounting after 24 Oct.
      s("L4", "Lko", "UP", { footfall: flat(60), sellers: sellers("L4-", 8, [{}, {}, {}, { name: "Discount C.", discount: 0.08 }]) }),
      s("B1", "Blr", "KA"), s("B2", "Blr", "KA"),
      s("B3", "Blr", "KA", { conv: (d) => (d > "2026-07-31" && isWeekend(d) ? 9 : 13),
        sellers: sellers("B3-", 8, [{ name: "Weekend A.", present: (d) => !(d > "2026-07-31" && isWeekend(d)) }]) }),
      // B5 opens between the two runs: never judged on either date.
      s("B5", "Blr", "KA", { opened_on: "2026-10-27", conv: flat(4), sellers: sellers("B5-", 2, [{ name: "New N.", discount: 0.1 }]) }),
    ],
  });
}
let cache: { prev: Issue[]; cur: Issue[]; out: Issue[] } | null = null;
const run = () => {
  if (!cache) {
    const w = world();
    // the discounter stops after 24 Oct: rewrite their lines after that date at full price
    const sp = new Set(w.bills.filter((b) => b.salesperson_id === "L4-4" && b.bill_date > "2026-10-24").map((b) => b.bill_id));
    for (const l of w.lines) if (sp.has(l.bill_id)) l.selling_price = l.mrp;
    const prev = detectAll({ asOf: "2026-10-24", ...w }).issues;
    const cur = detectAll({ asOf: "2026-10-31", ...w }).issues;
    cache = { prev, cur, out: attachFollowups(cur, prev, "2026-10-24") };
  }
  return cache;
};

test("before and after are the same metric computed by the same detector on each date", () => {
  const { prev, out } = run();
  const withF = out.filter((i) => i.followup);
  assert.ok(withF.length >= 3, `only ${withF.length} follow-ups`);
  for (const i of withF) {
    const p = prev.find((x) => x.id.split(":").slice(1).join(":") === i.id.split(":").slice(1).join(":"))!;
    assert.equal(i.followup!.before, headline(p)!.value, i.id);
    assert.equal(i.followup!.after, headline(i)!.value, i.id);
    assert.equal(i.followup!.metric, headline(i)!.metric);
  }
});

test("a discount that fell after last week's alert reads down and improved", () => {
  const d = run().out.find((i) => i.type === "discount_above_norm" && i.evidence.subject?.display_name === "Discount C.");
  assert.ok(d?.followup, "discounter flagged on both dates");
  assert.equal(d.followup.direction, "down");
  assert.equal(d.followup.improved, true);
});

test("guards still apply on both dates: no Diwali-only dip, no brand-new store", () => {
  const { prev, cur } = run();
  for (const list of [prev, cur]) {
    assert.equal(list.filter((i) => i.store_id === "L1" && i.lever === "more_bills").length, 0, "Diwali dip");
    assert.equal(list.filter((i) => i.store_id === "B5").length, 0, "new store");
  }
});

test("flagged last week but its metric cannot be read: not called new, says why", () => {
  const prev = [mk("2026-10-24", "missing_pair", [], ":SP1")];
  const cur = [mk("2026-10-31", "missing_pair", [], ":SP1")];
  const [o] = attachFollowups(cur, prev, "2026-10-24");
  assert.equal(o.followup, null);
  assert.match(o.followup_note!, /^Flagged on 2026-10-24 too/);
});
