// ₹ at stake over 28 days. Pure. Every input is shown as its own step in the evidence chain.

const round100 = (n: number) => Math.max(0, Math.round(n / 100) * 100);

/** Conversion lever: (gap in % points ÷ 100) × footfall × average bill value. */
export function rupeesAtStake(o: { gapPts: number; footfall: number; avgBillValue: number }): number {
  if (!(o.gapPts > 0)) return 0;
  return round100((o.gapPts / 100) * o.footfall * o.avgBillValue);
}

/** Rate levers (pair attach, category, repeat, discount): (gap in % points ÷ 100) × base count × ₹ per unit. */
export function rupeesFromRate(o: { gapPts: number; base: number; rupeesPerUnit: number }): number {
  if (!(o.gapPts > 0)) return 0;
  return round100((o.gapPts / 100) * o.base * o.rupeesPerUnit);
}
