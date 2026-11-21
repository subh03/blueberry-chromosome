// Detector tests on a synthetic world (tests/fixtures/world.ts). No real data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWorld, isWeekend, sellers, type StoreSpec, type World } from "./fixtures/world";
import { detectAll, numberTokens, rankIssues, amTop, binomLowerTail, type DetectInput } from "../engine/detectors";
import { rupeesAtStake } from "../engine/rupees";
import { BRIEF_PROBLEMS, buildBriefScorecard } from "../engine/scorecard";
import type { DataQualityFlag, Issue } from "../types";

const AS_OF = "2026-10-31";
const flat = (n: number) => () => n;
const from = (d: string, before: number, after: number) => (x: string) => (x > d ? after : before);

const input = (w: World, asOf = AS_OF): DetectInput => ({ asOf, ...w });

/** The rich world: one planted problem per detector, plus traps (new store, bad-footfall days, a leaver). */
function richWorld(): World {
  const s = (store_id: string, city: string, state: string, extra: Partial<StoreSpec> = {}): StoreSpec => ({
    store_id, city, state, area_manager_id: `AM-${city}`, footfall: flat(40), conv: flat(13), sellers: sellers(`${store_id}-`, 6), ...extra,
  });
  return buildWorld({
    from: "2025-05-01",
    to: AS_OF,
    diwali: ["2025-10-20", "2026-11-08"],
    stores: [
      s("L1", "Lko", "UP"),
      // L2: top seller (weight 4) leaves on 14 Sep, conversion falls after.
      s("L2", "Lko", "UP", {
        conv: from("2026-09-14", 13, 9.5),
        sellers: sellers("L2-", 6, [{ name: "Top S.", weight: 4, lastRoster: "2026-09-14" }]),
      }),
      // L3: walk-ins steady, fewer buying from August. No staffing change.
      s("L3", "Lko", "UP", { conv: from("2026-07-31", 13, 9.5) }),
      // L4: salesperson behaviour problems.
      s("L4", "Lko", "UP", {
        footfall: flat(60),
        sellers: sellers("L4-", 8, [
          {},
          { name: "Nopair A.", jacketP: 0.03 },
          { name: "Noindo B.", indoP: 0.003 },
          { name: "Discount C.", discount: 0.08 },
          { name: "Model D.", repeatP: 0.35 },
          { name: "Gone E.", jacketP: 0.03, weight: 0.3, lastRoster: "2026-06-30" },
          { name: "Lowrep F.", repeatP: 0 },
        ]),
      }),
      // Kanpur: whole city loses a fifth of its walk-ins in the last 28 days. Last year was flat.
      ...["K1", "K2", "K3"].map((id) => s(id, "Knp", "UP", { footfall: from("2026-10-03", 40, 32) })),
      s("B1", "Blr", "KA"), s("B2", "Blr", "KA"),
      // B3: two people stop working weekends from August; weekend conversion falls.
      s("B3", "Blr", "KA", {
        conv: (d) => (d > "2026-07-31" && isWeekend(d) ? 9 : 13),
        sellers: sellers("B3-", 8, [
          { name: "Weekend A.", present: (d) => !(d > "2026-07-31" && isWeekend(d)) },
          { name: "Weekend B.", present: (d) => !(d > "2026-07-31" && isWeekend(d)) },
        ]),
      }),
      s("B4", "Blr", "KA"),
      // B5: brand new and weak. Must never be judged or used as a peer.
      s("B5", "Blr", "KA", {
        opened_on: "2026-10-10", footfall: flat(120), conv: flat(5),
        sellers: sellers("B5-", 2, [{ name: "New N.", discount: 0.1 }]),
      }),
      s("P1", "Pat", "BR"), s("P2", "Pat", "BR"),
      // P3: 11 days where the door camera wrote 0 walk-ins but bills were made.
      s("P3", "Pat", "BR", { recordedFootfall: (d, real) => (d >= "2026-10-10" && d <= "2026-10-20" ? 0 : real) }),
    ],
  });
}

let cache: { w: World; issues: Issue[] } | null = null;
const rich = () => {
  if (!cache) {
    const w = richWorld();
    cache = { w, issues: detectAll(input(w)).issues };
  }
  return cache;
};
const find = (type: string, store?: string) => rich().issues.filter((i) => i.type === type && (!store || i.store_id === store));

// ---------- ₹ at stake ----------
test("rupeesAtStake = conversion gap × footfall × average bill value, rounded to ₹100, never negative", () => {
  assert.equal(rupeesAtStake({ gapPts: 1.6, footfall: 1000, avgBillValue: 5000 }), 80_000);
  assert.equal(rupeesAtStake({ gapPts: 1.234, footfall: 1111, avgBillValue: 4321 }), 59_200);
  assert.equal(rupeesAtStake({ gapPts: -2, footfall: 1000, avgBillValue: 5000 }), 0);
});

test("binomLowerTail is the exact P(Y ≤ y) (pair test on small counts)", () => {
  assert.equal(binomLowerTail(0, 10, 0.5), 1 / 1024);
  assert.equal(binomLowerTail(10, 10, 0.5), 1);
  assert.ok(Math.abs(binomLowerTail(2, 20, 0.5) - 211 / 1048576) < 1e-12);
});

// ---------- More bills ----------
test("staff_absent_or_left: top seller drops off the roster and conversion falls vs peers", () => {
  const [i] = find("staff_absent_or_left", "L2");
  assert.ok(i, "L2 should be flagged");
  assert.equal(i.lever, "more_bills");
  assert.match(i.cause, /Top S\./);
  assert.match(i.cause, /14 Sep/);
  const labels = i.evidence.steps.map((s) => s.label).join(" | ");
  for (const want of [/footfall/i, /average bill value/i, /gap/i, /₹ at stake/i]) assert.match(labels, want);
});

test("₹ at stake on a conversion issue is reproducible from the three inputs shown in the evidence", () => {
  const [i] = find("staff_absent_or_left", "L2");
  const step = (re: RegExp) => i.evidence.steps.find((s) => re.test(s.label))!;
  const gap = step(/gap/i).value;
  const ff = step(/footfall/i).value;
  const abv = step(/average bill value/i).value;
  assert.ok(gap > 1, `gap ${gap}`);
  assert.equal(i.rupees_at_stake, rupeesAtStake({ gapPts: gap, footfall: ff, avgBillValue: abv }));
  assert.equal(step(/₹ at stake/i).value, i.rupees_at_stake);
});

test("understaffed_busy_days: weekend floor shrinks and weekend conversion falls; names the people", () => {
  const [i] = find("understaffed_busy_days", "B3");
  assert.ok(i, "B3 should be flagged");
  assert.match(i.cause, /Weekend A\./);
  assert.match(i.action.when, /Sat/);
  assert.match(i.action.what, /\d people on the floor/);
  // one conversion issue per store: the specific weekend cause wins over the generic one
  assert.equal(rich().issues.filter((x) => x.store_id === "B3" && x.lever === "more_bills").length, 1);
});

test("conversion_drop_footfall_steady: fewer walk-ins buying, nothing more specific explains it", () => {
  const [i] = find("conversion_drop_footfall_steady", "L3");
  assert.ok(i, "L3 should be flagged");
  assert.ok(i.rupees_at_stake > 0);
});

test("city_slowdown: a whole city falling is one market note, not store alerts", () => {
  const c = find("city_slowdown");
  assert.equal(c.length, 1);
  assert.equal(c[0].area_manager_id, "AM-Knp");
  assert.match(c[0].cause, /K1/);
  assert.equal(rich().issues.filter((x) => x.store_id.startsWith("K") && x.type !== "city_slowdown").length, 0);
});

test("leavers come from the roster only: a seller on the roster with no sales for weeks is not 'left'", () => {
  const w = buildWorld({
    from: "2026-03-01", to: AS_OF,
    stores: [
      { store_id: "X1", city: "C", state: "S", footfall: flat(40), conv: from("2026-09-20", 13, 9),
        sellers: sellers("X1-", 6, [{ name: "Quiet Q.", weight: 4, sells: (d) => d <= "2026-09-20" }]) },
      ...["X2", "X3"].map((id) => ({ store_id: id, city: "C", state: "S", footfall: flat(40), conv: flat(13), sellers: sellers(`${id}-`, 6) })),
      ...["Y1", "Y2"].map((id) => ({ store_id: id, city: "D", state: "S", footfall: flat(40), conv: flat(13), sellers: sellers(`${id}-`, 6) })),
    ],
  });
  const issues = detectAll(input(w)).issues;
  assert.equal(issues.filter((i) => i.type === "staff_absent_or_left").length, 0);
});

// ---------- Data-quality guard ----------
test("DQ guard: brand-new store BLR-05-style is never judged", () => {
  assert.equal(rich().issues.filter((i) => i.store_id === "B5").length, 0);
});

test("DQ guard: days with bills > recorded walk-ins (PAT-03-style) raise no alert", () => {
  assert.equal(rich().issues.filter((i) => i.store_id === "P3" || i.area_manager_id === "AM-Pat").length, 0);
});

test("DQ guard: a city-wide door-camera outage (walk-ins written as 0) is not a city slowdown", () => {
  const outage = (d: string, real: number) => (d >= "2026-10-10" && d <= "2026-10-20" ? 0 : real);
  const st = (store_id: string, city: string, state: string, cam = false): StoreSpec => ({
    store_id, city, state, area_manager_id: `AM-${city}`, footfall: flat(40), conv: flat(13), sellers: sellers(`${store_id}-`, 6),
    ...(cam ? { recordedFootfall: outage } : {}),
  });
  const w = buildWorld({
    from: "2025-05-01", to: AS_OF,
    stores: [st("P1", "Pat", "BR", true), st("P2", "Pat", "BR", true), st("P3", "Pat", "BR", true), st("M1", "Mzf", "BR"), st("M2", "Mzf", "BR"), st("L1", "Lko", "UP"), st("L2", "Lko", "UP")],
  });
  assert.deepEqual(detectAll(input(w)).issues.filter((i) => i.type === "city_slowdown").map((i) => i.store_id), []);
});

test("DQ guard: the Diwali dip is a normal festival swing, not an alert", () => {
  const diwali = "2025-10-20";
  const near = (d: string) => Math.abs(Date.parse(d) - Date.parse(diwali)) <= 3 * 86_400_000;
  const spec = (store_id: string, city: string, state: string, deep = false): StoreSpec => ({
    store_id, city, state, area_manager_id: `AM-${city}`,
    footfall: (d) => (near(d) ? (deep ? 160 : 25) : 40),
    conv: (d) => (near(d) ? (deep ? 0 : 6) : 13),
    sellers: sellers(`${store_id}-`, 6),
  });
  const w = buildWorld({
    from: "2025-02-01", to: "2025-10-31", diwali: [diwali],
    stores: [spec("L1", "Lko", "UP", true), spec("L2", "Lko", "UP"), spec("L3", "Lko", "UP"),
      spec("K1", "Knp", "UP"), spec("K2", "Knp", "UP"), spec("B1", "Blr", "KA"), spec("B2", "Blr", "KA")],
  });
  const issues = detectAll(input(w, "2025-10-31")).issues;
  assert.deepEqual(issues.map((i) => `${i.store_id}:${i.type}`), []);
});

// ---------- Bigger baskets ----------
test("missing_pair: salesperson far below their own store on jacket-with-kurta", () => {
  const i = find("missing_pair", "L4");
  assert.equal(i.length, 1, i.map((x) => x.cause).join(" / "));
  assert.equal(i[0].evidence.subject?.display_name, "Nopair A.");
  assert.ok(i[0].evidence.peer, "names a same-store peer");
  assert.equal(i[0].lever, "bigger_baskets");
});

test("missing_pair skips people who have left (roster rule)", () => {
  assert.ok(!rich().issues.some((i) => i.evidence.subject?.display_name === "Gone E."));
});

test("category_avoidance: salesperson rarely sells a category their city buys", () => {
  const [i] = find("category_avoidance", "L4");
  assert.ok(i);
  assert.equal(i.evidence.subject?.display_name, "Noindo B.");
  assert.match(i.cause, /Indo-Western/);
});

test("discount_above_norm: salesperson discounts well above the store's norm", () => {
  const i = find("discount_above_norm");
  assert.deepEqual(i.map((x) => x.evidence.subject?.display_name), ["Discount C."]);
});

// ---------- More repeat ----------
test("role_model and low_repeat use all-time repeat, compared within the store", () => {
  const [rm] = find("role_model", "L4");
  assert.equal(rm?.evidence.subject?.display_name, "Model D.");
  const [lo] = find("low_repeat", "L4");
  assert.equal(lo?.evidence.subject?.display_name, "Lowrep F.");
  assert.equal(lo.evidence.peer?.display_name, "Model D.", "low_repeat learns from the store's role model");
  assert.equal(lo.lever, "more_repeat");
});

test("every salesperson-level issue names a different, same-store peer (cards must name one)", () => {
  const w = rich().w;
  const storeOf = new Map(w.salespeople.map((s) => [s.salesperson_id, s.store_id]));
  for (const i of rich().issues.filter((x) => x.evidence.subject)) {
    const p = i.evidence.peer;
    assert.ok(p, `${i.id} has no peer`);
    assert.equal(storeOf.get(p.salesperson_id), i.store_id, `${i.id}: peer not in the same store`);
    assert.notEqual(p.salesperson_id, i.evidence.subject!.salesperson_id);
  }
});

test("role_model card points the role model at the colleague who needs it most", () => {
  const [rm] = find("role_model", "L4");
  assert.equal(rm.evidence.peer?.display_name, "Lowrep F.");
});

// ---------- Evidence honesty ----------
test("every number in cause, action and steps is in allowedNumbers", () => {
  for (const i of rich().issues) {
    const allowed = new Set(i.evidence.allowedNumbers);
    const text = [i.cause, i.action.who, i.action.what, i.action.when, ...i.evidence.steps.flatMap((s) => [s.display, s.compare_to?.display ?? ""])].join(" ");
    for (const t of numberTokens(text)) assert.ok(allowed.has(t), `${i.id}: "${t}" not allowed (${[...allowed].join(", ")})`);
  }
});

test("numberTokens ignores IDs like LKO-02 and SP1018 but keeps ₹, % and dates", () => {
  assert.deepEqual(numberTokens("LKO-02 SP1018 lost ₹1,24,000; 11.0% vs 12.6% since 14 Sep, 6 people"), ["₹1,24,000", "11.0%", "12.6%", "14", "6"]);
});

// ---------- Ranking + scorecard ----------
test("rankIssues ranks by ₹ within each area manager; amTop keeps ≤5 alerts and no market notes", () => {
  const ranked = rankIssues(rich().issues);
  for (const am of new Set(ranked.map((i) => i.area_manager_id))) {
    const mine = ranked.filter((i) => i.area_manager_id === am && i.type !== "city_slowdown");
    mine.forEach((x, k) => assert.equal(x.rank, k + 1));
    for (let k = 1; k < mine.length; k++) assert.ok(mine[k - 1].rupees_at_stake >= mine[k].rupees_at_stake);
  }
  const top = amTop(ranked, 5);
  for (const list of Object.values(top)) {
    assert.ok(list.length <= 5);
    assert.ok(list.every((i) => i.type !== "city_slowdown"));
  }
});

test("scorecard lists every problem from the brief with found / not found / data issue and an evidence link", () => {
  const issues = rankIssues(rich().issues);
  const flags: DataQualityFlag[] = [
    { id: "dq:new", store_id: "B5", kind: "new_store_no_baseline", detail: "", rows_affected: 22, alerted: false },
  ];
  const sc = buildBriefScorecard(AS_OF, issues, flags);
  assert.equal(sc.title, "Problems from the brief");
  assert.deepEqual(sc.rows.map((r) => r.type), BRIEF_PROBLEMS.map((p) => p.type));
  for (const r of sc.rows) {
    if (r.status === "found") {
      const top = issues.filter((i) => i.type === r.type).sort((a, b) => b.rupees_at_stake - a.rupees_at_stake)[0];
      assert.equal(r.top_issue_id, top.id);
    } else assert.equal(r.top_issue_id, null);
  }
  assert.equal(sc.rows.find((r) => r.type === "new_store_no_baseline")!.status, "data_issue");
  assert.equal(sc.rows.find((r) => r.type === "bills_exceed_footfall")!.status, "not_found");
});

test("scorecard: a market note is labelled, valued apart, and never the store total or the biggest problem", () => {
  const mk = (id: string, type: string, rupees: number) => ({ id, type, store_id: "S", rupees_at_stake: rupees } as unknown as Issue);
  const issues = [mk("city", "city_slowdown", 900_000), mk("left", "staff_absent_or_left", 300_000), mk("pair", "missing_pair", 10_000), mk("rm", "role_model", 0)];
  const sc = buildBriefScorecard(AS_OF, issues, []);
  const row = (t: string) => sc.rows.find((r) => r.type === t)!;
  assert.equal(row("city_slowdown").kind, "market_note");
  assert.equal(row("city_slowdown").rupees_at_stake, 900_000, "still visible and valued");
  for (const r of sc.rows) {
    if (r.lever === "not_a_problem") assert.equal(r.kind, "data_quality", r.type);
    else if (r.type !== "city_slowdown") assert.equal(r.kind, "store", r.type);
  }
  assert.equal(sc.store_rupees_at_stake, 310_000);
  assert.equal(sc.market_rupees_at_stake, 900_000);
  assert.equal(sc.biggest_issue_id, "left");
});
