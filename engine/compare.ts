// Before/after comparison of one store against its peers (same city, same state).
import { conversion, discountPct, inRange, itemsPerBill, sumDays, type StoreDay } from "./metrics";

export interface StoreInfo {
  store_id: string;
  city: string;
  state: string;
  opened_on: string;
}

export interface Window { from: string; to: string }

export interface Snapshot {
  conversion: number;
  ipb: number;
  discount_pct: number;
  footfall: number;
  bills: number;
}

export interface BeforeAfter { before: Snapshot; after: Snapshot; change: Snapshot }

export interface Comparison {
  store_id: string;
  store: BeforeAfter;
  city: BeforeAfter; // same-city peers, pooled, excluding the store
  state: BeforeAfter; // same-state peers, pooled, excluding the store
  cityPeers: string[];
  statePeers: string[];
  gapVsCity: Snapshot; // store change minus city-peer change
  gapVsState: Snapshot;
}

export function snapshot(days: StoreDay[]): Snapshot {
  const t = sumDays(days);
  return { conversion: conversion(t), ipb: itemsPerBill(t), discount_pct: discountPct(t), footfall: t.footfall, bills: t.bills };
}

const diff = (a: Snapshot, b: Snapshot): Snapshot => ({
  conversion: a.conversion - b.conversion,
  ipb: a.ipb - b.ipb,
  discount_pct: a.discount_pct - b.discount_pct,
  footfall: a.footfall - b.footfall,
  bills: a.bills - b.bills,
});

function beforeAfter(days: StoreDay[], ids: Set<string>, before: Window, after: Window): BeforeAfter {
  const mine = days.filter((d) => ids.has(d.store_id));
  const b = snapshot(mine.filter((d) => inRange(d.date, before.from, before.to)));
  const a = snapshot(mine.filter((d) => inRange(d.date, after.from, after.to)));
  return { before: b, after: a, change: diff(a, b) };
}

/**
 * Peers exclude the store itself and any store opened after `before.from`
 * (no baseline, e.g. a brand-new store).
 */
export function compareWindows(days: StoreDay[], stores: StoreInfo[], storeId: string, before: Window, after: Window): Comparison {
  const me = stores.find((s) => s.store_id === storeId);
  if (!me) throw new Error(`unknown store ${storeId}`);
  const eligible = stores.filter((s) => s.store_id !== storeId && s.opened_on <= before.from);
  const cityPeers = eligible.filter((s) => s.city === me.city).map((s) => s.store_id);
  const statePeers = eligible.filter((s) => s.state === me.state).map((s) => s.store_id);

  const store = beforeAfter(days, new Set([storeId]), before, after);
  const city = beforeAfter(days, new Set(cityPeers), before, after);
  const state = beforeAfter(days, new Set(statePeers), before, after);
  return {
    store_id: storeId,
    store, city, state, cityPeers, statePeers,
    gapVsCity: diff(store.change, city.change),
    gapVsState: diff(store.change, state.change),
  };
}
