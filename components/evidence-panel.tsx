import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Issue } from "@/types";
import { FollowupBadge } from "@/components/followup-badge";
import { cardHref, groupSteps } from "@/lib/ui/home";

/** Step-by-step evidence for one issue: what changed, compared with what, why it matters, the ₹ maths. */
export function EvidencePanel({
  issue,
  showCardLink = true,
}: {
  issue: Issue;
  showCardLink?: boolean;
}) {
  const { money, compared, inputs } = groupSteps(issue);
  const why = compared.length ? inputs : inputs.slice(1);
  const comparedSteps = compared.length ? compared : inputs.slice(0, 1);
  return (
    <section
      className="evidence-panel"
      aria-label={`Evidence for ${issue.store_id}`}
      tabIndex={-1}
    >
      <ol className="evidence-flow">
        <li>
          <h3>What changed</h3>
          <p className="evidence-lead">{issue.cause}</p>
        </li>
        {comparedSteps.length > 0 && (
          <li>
            <h3>Compared with what</h3>
            <ul className="fact-list">
              {comparedSteps.map((step) => (
                <li key={step.label} title={`${step.formula}, ${step.rows.toLocaleString("en-IN")} rows`}>
                  <span>{step.label}</span>
                  <strong>
                    {step.display}
                    {step.compare_to && (
                      <span className="fact-was">
                        {" "}
                        vs {step.compare_to.display} ({step.compare_to.label})
                      </span>
                    )}
                  </strong>
                </li>
              ))}
            </ul>
          </li>
        )}
        {why.length > 0 && (
          <li>
            <h3>Why it matters</h3>
            <ul className="fact-list">
              {why.map((step) => (
                <li key={step.label} title={`${step.formula}, ${step.rows.toLocaleString("en-IN")} rows`}>
                  <span>{step.label}</span>
                  <strong>{step.display}</strong>
                </li>
              ))}
            </ul>
          </li>
        )}
        {money.length > 0 && (
          <li>
            <h3>The ₹ maths</h3>
            {money.map((step) => (
              <div key={step.label} className="money-maths">
                <p className="money-figure">{step.display}</p>
                <p>
                  {step.label}. Worked out as: {step.formula}.
                </p>
              </div>
            ))}
          </li>
        )}
        <li>
          <h3>Who acts</h3>
          <p>
            <strong>{issue.action.who}</strong>: {issue.action.what},{" "}
            {issue.action.when.charAt(0).toLowerCase() + issue.action.when.slice(1)}.
          </p>
          {issue.evidence.peer && (
            <p className="muted">
              Learn from {issue.evidence.peer.display_name}:{" "}
              {issue.evidence.peer.why.charAt(0).toLowerCase() +
                issue.evidence.peer.why.slice(1)}
              .
            </p>
          )}
        </li>
      </ol>
      <FollowupBadge issue={issue} />
      <details className="trace">
        <summary>Show every number with its formula ({issue.evidence.steps.length})</summary>
        <ul>
          {issue.evidence.steps.map((step) => (
            <li key={step.label}>
              <span>{step.label}</span>
              <strong>{step.display}</strong>
              <small>
                {step.formula}, {step.rows.toLocaleString("en-IN")} rows
              </small>
            </li>
          ))}
        </ul>
      </details>
      {showCardLink && (
        <Link className="btn btn-primary btn-wide" href={cardHref(issue)}>
          See today&rsquo;s action card
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
