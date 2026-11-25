import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Issue, Lang } from "@/types";
import { dict } from "@/lib/ui/i18n";
import { cardHref, inr } from "@/lib/ui/home";
import { cardText } from "@/lib/ui/roles";

/** One problem as an action: the checked card text in the chosen language, ₹, and a link to the full card. */
export function ActionItem({ issue, lang, index }: { issue: Issue; lang: Lang; index?: number }) {
  const d = dict(lang);
  const card = cardText(issue, lang);
  return (
    <li className="action-item">
      <div className="action-top">
        <span className="lever-tag">{d[issue.lever]}</span>
        {issue.rupees_at_stake > 0 && (
          <span className="money-figure">
            {inr(issue.rupees_at_stake)} <span className="muted small">{d.atStake}</span>
          </span>
        )}
      </div>
      {card ? (
        <>
          <p className="action-text" lang={card.lang}>
            {index !== undefined && <strong>{index + 1}. </strong>}
            {card.text}
          </p>
          <p className="trust-line small">
            <ShieldCheck size={16} aria-hidden="true" /> {d.numberCheck}
            {card.fellBack && <span className="muted"> · {d.englishOnly}</span>}
          </p>
        </>
      ) : (
        <dl className="action-facts">
          <dt>{d.why}</dt>
          <dd lang="en">{issue.cause}</dd>
          <dt>{d.doThis}</dt>
          <dd lang="en">
            {issue.action.what}. {issue.action.when}.
          </dd>
        </dl>
      )}
      <Link className="btn btn-ghost" href={cardHref(issue)}>
        {d.openCard} <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </li>
  );
}
