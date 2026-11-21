// A judge with a calculator: every ₹ at stake must come back from the numbers DISPLAYED in its evidence.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import type { Issue } from "../types";
import { buildWorld, isWeekend, sellers, type StoreSpec } from "./fixtures/world";
import { detectAll } from "../engine/detectors";

/** What a reader sees: "₹9,801" -> 9801, "1.6 pts" -> 1.6, "12.9%" -> 12.9, "1,935" -> 1935. */
const shown = (d: string) => Number(d.replace(/[₹,%]|pts/g, "").replace("−", "-").trim());

const INPUTS: Record<string, { labels: RegExp[]; calc: (x: number[]) => number }> = {
  staff_absent_or_left: { labels: [/gap/i, /footfall/i, /average bill value/i], calc: ([g, f, a]) => (g / 100) * f * a },
  understaffed_busy_days: { labels: [/gap/i, /footfall/i, /average bill value/i], calc: ([g, f, a]) => (g / 100) * f * a },
  conversion_drop_footfall_steady: { labels: [/gap/i, /footfall/i, /average bill value/i], calc: ([g, f, a]) => (g / 100) * f * a },
  city_slowdown: { labels: [/^Walk-ins lost/, /^City conversion/, /average bill value/i], calc: ([l, c, a]) => l * (c / 100) * a },
  missing_pair: { labels: [/gap/i, /bills per 28 days/, /^Average .* price/], calc: ([g, n, u]) => (g / 100) * n * u },
  category_avoidance: { labels: [/gap/i, /bills per 28 days/, /value per bill/], calc: ([g, n, u]) => (g / 100) * n * u },
  discount_above_norm: { labels: [/above the store's norm/, /MRP value sold per 28 days/], calc: ([g, m]) => (g / 100) * m },
  low_repeat: { labels: [/gap/i, /new customers per 28 days/, /average bill value/i], calc: ([g, n, a]) => (g / 100) * n * a },
  role_model: { labels: [], calc: () => 0 },
};

function check(i: Issue) {
  const spec = INPUTS[i.type];
  const vals = spec.labels.map((re) => {
    const s = i.evidence.steps.find((x) => re.test(x.label));
    assert.ok(s, `${i.id}: no step for ${re}`);
    return shown(s.display);
  });
  const expect = Math.max(0, Math.round(spec.calc(vals) / 100) * 100);
  assert.equal(i.rupees_at_stake, expect, `${i.id}: ₹${i.rupees_at_stake} but the shown inputs ${JSON.stringify(vals)} give ₹${expect}`);
  const rs = i.evidence.steps.find((x) => /₹ at stake/.test(x.label))!;
  assert.equal(shown(rs.display), i.rupees_at_stake, `${i.id}: ₹ step shows ${rs.display}`);
}

function world(): Issue[] {
  const flat = (n: number) => () => n;
  const from = (d: string, a: number, b: number) => (x: string) => (x > d ? b : a);
  const s = (store_id: string, city: string, state: string, extra: Partial<StoreSpec> = {}): StoreSpec => ({
    store_id, city, state, area_manager_id: `AM-${city}`, footfall: flat(40), conv: flat(13), sellers: sellers(`${store_id}-`, 6), ...extra,
  });
  return detectAll({ asOf: "2026-10-31", ...buildWorld({
    from: "2025-05-01", to: "2026-10-31", diwali: ["2025-10-20", "2026-11-08"],
    stores: [
      s("L1", "Lko", "UP"),
      s("L2", "Lko", "UP", { conv: from("2026-09-14", 13, 9.5), sellers: sellers("L2-", 6, [{ name: "Top S.", weight: 4, lastRoster: "2026-09-14" }]) }),
      s("L3", "Lko", "UP", { conv: from("2026-07-31", 13, 9.5) }),
      s("L4", "Lko", "UP", { footfall: flat(60), sellers: sellers("L4-", 8, [{}, { name: "Nopair A.", jacketP: 0.03 }, { name: "Noindo B.", indoP: 0.003 },
        { name: "Discount C.", discount: 0.08 }, { name: "Model D.", repeatP: 0.35 }, {}, { name: "Lowrep F.", repeatP: 0 }]) }),
      ...["K1", "K2", "K3"].map((id) => s(id, "Knp", "UP", { footfall: from("2026-10-03", 40, 32) })),
      s("B1", "Blr", "KA"), s("B2", "Blr", "KA"), s("B4", "Blr", "KA"),
      s("B3", "Blr", "KA", { conv: (d) => (d > "2026-07-31" && isWeekend(d) ? 9 : 13),
        sellers: sellers("B3-", 8, [{ name: "Weekend A.", present: (d) => !(d > "2026-07-31" && isWeekend(d)) }, { name: "Weekend B.", present: (d) => !(d > "2026-07-31" && isWeekend(d)) }]) }),
    ],
  }) }).issues;
}

test("every ₹ at stake reproduces from the displayed inputs (synthetic world, all 9 types)", () => {
  const issues = world();
  assert.equal(new Set(issues.map((i) => i.type)).size, 9);
  issues.forEach(check);
});

test("every ₹ at stake reproduces from the displayed inputs (real issues in data/generated)", { skip: !existsSync("data/generated/issues.json") }, () => {
  const { issues } = JSON.parse(readFileSync("data/generated/issues.json", "utf8")) as { issues: Issue[] };
  assert.ok(issues.length > 0);
  issues.forEach(check);
});
