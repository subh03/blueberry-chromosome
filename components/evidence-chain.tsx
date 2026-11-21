import Link from "next/link";
import type { Issue } from "@/types";
import { FollowupBadge } from "@/components/followup-badge";
export function EvidenceChain({ issue }: { issue: Issue }) {
  return (
    <section className="evidence" aria-label={`Evidence for ${issue.store_id}`}>
      <h3>{issue.store_id} · Evidence chain</h3>
      <p>{issue.cause}</p>
      <ol className="evidence-steps">
        {issue.evidence.steps.map((step) => (
          <li key={step.label}>
            <span>{step.label}</span>
            <strong title={`${step.formula} · ${step.rows} rows`}>
              {step.display}
            </strong>
            {step.compare_to && (
              <p>
                Compared with {step.compare_to.display} ·{" "}
                {step.compare_to.label}
              </p>
            )}
            <small>
              {step.formula} · {step.rows.toLocaleString("en-IN")} rows
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
        href={`/cards/for-issue?issue=${encodeURIComponent(issue.id)}`}
      >
        Open action card →
      </Link>
    </section>
  );
}
