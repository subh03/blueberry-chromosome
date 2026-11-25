import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Issue, Lang } from "@/types";
import { dict } from "@/lib/ui/i18n";
import { inr } from "@/lib/ui/home";
import { issueWords, problemHref, severityOfIssue } from "@/lib/ui/roles";

/** One problem in a role's list. The whole card opens the problem screen. */
export function ProblemRow({ issue, lang, from, index }: { issue: Issue; lang: Lang; from: string; index?: number }) {
  const d = dict(lang);
  const sev = severityOfIssue(issue);
  const { cause } = issueWords(issue, lang);
  return (
    <li>
      <Link className="problem-row" href={problemHref(issue, lang, from)}>
        <span className="problem-row-top">
          <span className="brief-tags">
            <span className={`chip chip-${sev}`}>{d[`sev${sev}`]}</span>
            <span className="store-tag">{issue.store_id}</span>
            <span className="lever-tag">{d[issue.lever]}</span>
          </span>
          {issue.rupees_at_stake > 0 && <span className="problem-row-money">{inr(issue.rupees_at_stake)}</span>}
        </span>
        <span className="problem-row-text" lang={cause.lang}>
          {index !== undefined && <strong>{index + 1}. </strong>}
          {cause.text}
        </span>
        <span className="problem-row-open">
          {d.openProblem} <ArrowRight size={18} aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}
