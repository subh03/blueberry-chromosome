"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import type { Issue, ScorecardRow } from "@/types";
import { EvidencePanel } from "@/components/evidence-panel";
import { FollowupBadge } from "@/components/followup-badge";
import { inr, severityLabel, severityOf } from "@/lib/ui/home";

export type ProblemItem = {
  row: ScorecardRow;
  issue: Issue | null;
  /** How many issues of this type the row adds up, and the biggest single one (from issues.json). */
  count?: number;
  biggest?: number;
};


export function ProblemList({ items }: { items: ProblemItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
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

  return (
    <ol className="problem-list">
      {items.map(({ row, issue, count = 1, biggest }) => {
        const id = issue?.id ?? row.type;
        const expanded = open === id;
        const severity = severityOf(row, biggest);
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
                      {count > 1 ? `Biggest case: ${issue.cause}` : issue.cause}
                    </span>
                  )}
                  {issue && <FollowupBadge issue={issue} compact />}
                </span>
                {severity !== "model" && (
                  <span className="problem-money">
                    <strong>{inr(rupees)}</strong>
                    <span>
                      {count > 1 && biggest !== undefined
                        ? `at stake across ${count} people · biggest ${inr(biggest)}`
                        : "at stake"}
                    </span>
                  </span>
                )}
                <ChevronDown className="problem-chevron" size={22} aria-hidden="true" />
              </span>
              {severity !== "model" && (
                <span className="bar" aria-hidden="true">
                  <span
                    className="bar-fill"
                    style={{ transform: `scaleX(${rupees / max})` } as CSSProperties}
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
