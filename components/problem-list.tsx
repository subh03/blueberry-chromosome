"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import type { Issue, ScorecardRow } from "@/types";
import { EvidencePanel } from "@/components/evidence-panel";
import { inr, severityLabel, severityOf } from "@/lib/ui/home";

export type ProblemItem = { row: ScorecardRow; issue: Issue | null };

const BAR_DELAYS = [0, 70, 130, 180, 220, 250];

export function ProblemList({ items }: { items: ProblemItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const max = Math.max(1, ...items.map((item) => item.row.rupees_at_stake ?? 0));

  const reveal = (id: string) => {
    setOpen(id);
    requestAnimationFrame(() => {
      const card = document.getElementById(`problem-${id}`);
      const panel = card?.querySelector<HTMLElement>(".evidence-panel");
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      card?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      panel?.focus({ preventScroll: true });
    });
  };

  useEffect(() => {
    const onOpen = (event: Event) => reveal((event as CustomEvent<string>).detail);
    window.addEventListener("sc:open", onOpen);
    return () => window.removeEventListener("sc:open", onOpen);
  }, []);

  // ₹ bars grow once when the list first enters view. Bars are full width until armed.
  useEffect(() => {
    const el = list.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      el.dataset.bars = "grow";
      return;
    }
    el.dataset.bars = "armed";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.dataset.bars = "grow";
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <ol className="problem-list" ref={list}>
      {items.map(({ row, issue }, index) => {
        const id = issue?.id ?? row.type;
        const expanded = open === id;
        const severity = severityOf(row);
        const rupees = row.rupees_at_stake ?? 0;
        return (
          <li
            key={row.type}
            id={`problem-${id}`}
            className="problem"
            data-open={expanded || undefined}
          >
            <button
              type="button"
              className="problem-card"
              aria-expanded={expanded}
              aria-controls={`panel-${row.type}`}
              disabled={!issue}
              onClick={() => (expanded ? setOpen(null) : reveal(id))}
            >
              <span className="problem-top">
                <span className={`chip chip-${severity}`}>{severityLabel[severity]}</span>
                {row.store_ids.map((store) => (
                  <span key={store} className="store-tag">
                    {store}
                  </span>
                ))}
              </span>
              <span className="problem-main">
                <span className="problem-text">
                  <span className="problem-title">{row.brief_problem}</span>
                  {issue && (
                    <span className="problem-line">
                      {row.store_ids.length > 1 ? `Biggest case: ${issue.cause}` : issue.cause}
                    </span>
                  )}
                </span>
                {severity !== "model" && (
                  <span className="problem-money">
                    <strong>{inr(rupees)}</strong>
                    <span>at stake</span>
                  </span>
                )}
                <ChevronDown className="problem-chevron" size={22} aria-hidden="true" />
              </span>
              {severity !== "model" && (
                <span className="bar" aria-hidden="true">
                  <span
                    className="bar-fill"
                    style={
                      {
                        "--r": rupees / max,
                        "--d": `${BAR_DELAYS[Math.min(index, BAR_DELAYS.length - 1)]}ms`,
                      } as CSSProperties
                    }
                  />
                </span>
              )}
            </button>
            <div id={`panel-${row.type}`} hidden={!expanded}>
              {expanded && issue && <EvidencePanel issue={issue} />}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
