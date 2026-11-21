// Template cards: the safe fallback when Gemini is slow, fails or is rejected.
// Filled only from the evidence (displays the engine wrote), so they pass the same validator.
// Wording checked with storyscope-writing + humanizer: action first, the number, then the peer.
import type { EvidenceStep, Issue } from "../types";

type CardIssue = Pick<Issue, "type" | "store_id" | "cause" | "action" | "evidence">;

const firstName = (n?: string) => (n ? n.split(/\s+/)[0] : "");
const lower1 = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const byLabel = (steps: EvidenceStep[], re: RegExp) => steps.find((s) => re.test(s.label));

/** Shubh's original shape: always safe, used when the evidence lacks what a template needs. */
function plain(i: CardIssue): string {
  const trim = (s: string) => s.trim().replace(/[.\s]+$/, "");
  return `${i.action.who}: ${trim(i.action.what)}. When: ${trim(i.action.when)}. Why: ${trim(i.cause)}.`;
}

export function renderTemplate(i: CardIssue): string {
  try {
    return render(i) ?? plain(i);
  } catch {
    return plain(i);
  }
}

function render(i: CardIssue): string | null {
  const ev = i.evidence;
  const steps = ev.steps ?? [];
  const s0 = steps[0];
  const you = firstName(ev.subject?.display_name);
  const peer = ev.peer?.display_name ?? "";
  const store = i.store_id;
  const pp = s0?.compare_to ? { p: s0.display, p0: s0.compare_to.display } : null;

  switch (i.type) {
    case "missing_pair": {
      const m = s0?.label.match(/: (.+?) bills with a (.+?), last /);
      if (!pp || !m || !you || !peer) return null;
      const base = m[1] === "Kurta Set" ? "kurta" : m[1].toLowerCase();
      return `${you}, today ${lower1(i.action.what)}. You add a ${m[2]} to ${pp.p} of ${base} bills, and the rest of ${store} manage ${pp.p0}. ${peer} does this best in ${store}, so watch how they bring it out. If the customer says no, that's fine, but let them hold it first.`;
    }
    case "category_avoidance": {
      const cat = s0?.label.match(/bills with (.+?),/)?.[1];
      const city = s0?.compare_to?.label.replace(/^Rest of /, "");
      if (!pp || !cat || !city || !you || !peer) return null;
      return `${you}, today ${lower1(i.action.what)}, even if they came in for something else. ${cat} is on ${pp.p0} of bills across ${city} and on ${pp.p} of yours. ${peer} sells the most ${cat} in ${store}: ask which pieces they show first.`;
    }
    case "discount_above_norm":
      if (!pp || !you || !peer) return null;
      return `${you}, from today ${lower1(i.action.what)}. Your bills average ${pp.p} off MRP, and the rest of ${store} gives ${pp.p0}. ${peer} discounts the least here. Ask them what they say when a customer wants a better price.`;
    case "low_repeat":
      if (!pp || !you || !peer) return null;
      return `${you}, from today ${lower1(i.action.what)}. ${pp.p} of your customers have come back, against ${pp.p0} for the rest of ${store}. Ask ${peer} what they say to customers on the way out.`;
    case "role_model":
      if (!pp || !you || !peer) return null;
      return `${you}, today show the team how you follow up with customers. Start with ${peer}. ${pp.p} of your customers come back, and the rest of ${store} is at ${pp.p0}.`;
    case "staff_absent_or_left": {
      const conv = byLabel(steps, /^Conversion, since/);
      const last = byLabel(steps, / last on roster$/);
      if (!conv?.compare_to || !last || !peer) return null;
      const leaver = last.label.replace(/ last on roster$/, "");
      return `${firstName(peer)}, this Saturday and Sunday please take the floor at the busiest hours and have the newest seller shadow you. ${leaver} has not been on the roster since ${last.display}, and fewer walk-ins at ${store} are buying: ${conv.display}, down from ${conv.compare_to.display}.`;
    }
    case "understaffed_busy_days": {
      const conv = byLabel(steps, /^Conversion \(Sat and Sun\)/);
      const target = byLabel(steps, /^Weekend floor target/);
      if (!conv?.compare_to || !target) return null;
      return `Store team, ${store}: this Saturday and Sunday, keep ${target.display} people on the floor. Weekend conversion fell from ${conv.compare_to.display} to ${conv.display} as weekend shifts thinned out. If your weekly off is on a weekend, talk to the store manager today about moving it.`;
    }
    case "conversion_drop_footfall_steady": {
      const conv = byLabel(steps, /^Conversion,/);
      if (!conv?.compare_to || !peer) return null;
      return `Store team, ${store}: today ${peer} greets each walk-in and hands them to a free seller. Everyone else, ask each customer who leaves without buying what they wanted. Walk-ins are steady, but fewer are buying: ${conv.display}, down from ${conv.compare_to.display}.`;
    }
    case "city_slowdown": {
      const city = s0?.label.match(/^(.+?) stores compared/)?.[1];
      if (!city) return null;
      return `Store team, ${store}: today, show every customer who comes in a second option before they decide. Fewer people are walking in at every ${city} store, so the area manager is treating it as a market dip.`;
    }
  }
  return null;
}
