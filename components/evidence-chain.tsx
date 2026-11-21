"use client";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import type { Issue } from "@/types";
import { FollowupBadge } from "@/components/followup-badge";
export function EvidenceChain({ issue }: { issue: Issue }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = panel.current;
    const details = element?.closest("details");
    let frame = 0;
    const enter = () => {
      if (details && !details.open) return;
      frame = requestAnimationFrame(() => {
        let seen = false;
        try {
          seen = sessionStorage.getItem(`evidence:${issue.id}`) === "seen";
          sessionStorage.setItem(`evidence:${issue.id}`, "seen");
        } catch {
          /* Evidence remains usable when storage is unavailable. */
        }
        element?.setAttribute("data-stagger", String(!seen));
      });
    };
    enter();
    details?.addEventListener("toggle", enter);
    return () => {
      cancelAnimationFrame(frame);
      details?.removeEventListener("toggle", enter);
    };
  }, [issue.id]);
  return (
    <section
      ref={panel}
      tabIndex={-1}
      className="evidence"
      aria-label={`Evidence for ${issue.store_id}`}
    >
      <h3>{issue.store_id}, evidence chain</h3>
      <p>{issue.cause}</p>
      <ol className="evidence-steps">
        {issue.evidence.steps.length === 0 && (
          <li>No metric steps were supplied for this issue.</li>
        )}
        {issue.evidence.steps.map((step, index) => (
          <li
            key={step.label}
            style={
              {
                "--step-delay": `${[40, 60, 75, 85, 95, 100][Math.min(index, 5)]}ms`,
              } as CSSProperties
            }
          >
            <span>{step.label}</span>
            <strong
              className={step.display.includes("₹") ? "money" : ""}
              title={`${step.formula}, ${step.rows} rows`}
            >
              {step.display}
            </strong>
            {step.compare_to && (
              <p>
                Compared with {step.compare_to.display}, {step.compare_to.label}
              </p>
            )}
            <small className="formula">
              {step.formula}, {step.rows.toLocaleString("en-IN")} rows
            </small>
          </li>
        ))}
      </ol>
      <FollowupBadge followup={issue.followup} />
      <h4>Peer comparison</h4>
      <p>
        {issue.evidence.peer
          ? `${issue.evidence.peer.display_name} · ${issue.evidence.peer.why}`
          : "No named salesperson peer is supplied for this issue."}
      </p>
      <h4>Action</h4>
      <p>
        {issue.action.who} · {issue.action.what} · {issue.action.when}
      </p>
      <Link
        className="text-link"
        href={`/cards/for-issue?issue=${encodeURIComponent(issue.id)}&audience=${issue.type === "city_slowdown" ? "am" : "salesperson"}`}
      >
        Open action card
      </Link>
    </section>
  );
}
