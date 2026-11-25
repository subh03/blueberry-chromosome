import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { LangSwitch } from "@/components/lang-switch";
import { EvidencePanel } from "@/components/evidence-panel";
import { FollowupBadge } from "@/components/followup-badge";
import { ShareButtons } from "@/components/share-buttons";
import { dict, langOf, withLang } from "@/lib/ui/i18n";
import { cardHref, inr } from "@/lib/ui/home";
import { ISSUES, audienceOf, cardText, issueById, issueWords, severityOfIssue } from "@/lib/ui/roles";

type Props = { params: Promise<{ issueId: string }>; searchParams: Promise<{ lang?: string; from?: string }> };

export function generateStaticParams() {
  return ISSUES.map((i) => ({ issueId: encodeURIComponent(i.id) }));
}

const decode = (raw: string) => {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const issue = issueById(decode((await params).issueId));
  return { title: issue ? `Problem at ${issue.store_id}` : "Problem" };
}

/** Only our own role pages can be the "back" target. */
const safeFrom = (from?: string) => (from && /^\/(am|store|me|overview)(\/[A-Za-z0-9-]+)?$/.test(from) ? from : "/overview");

/** One problem, in the order a person needs it: what is wrong → how we know → what to do → the card to send. */
async function ProblemPage({ params, searchParams }: Props) {
  const [{ issueId }, sp] = await Promise.all([params, searchParams]);
  const issue = issueById(decode(issueId));
  if (!issue) notFound();
  const lang = langOf(sp.lang);
  const d = dict(lang);
  const from = safeFrom(sp.from);
  const sev = severityOfIssue(issue);
  const words = issueWords(issue, lang);
  const card = cardText(issue, lang);
  const audience = audienceOf(issue);
  const recipient = audience === "salesperson" && issue.evidence.subject ? issue.evidence.subject.display_name : issue.action.who;
  const here = `/problem/${encodeURIComponent(issue.id)}${from !== "/overview" ? `?from=${encodeURIComponent(from)}` : ""}`;

  return (
    <main id="main-content" tabIndex={-1} className="shell page role-page role-narrow" lang={lang}>
      <div className="page-head">
        <LangSwitch path={here} lang={lang} />
        <Link className="back-link" href={withLang(from, lang)}>
          <ArrowLeft size={18} aria-hidden="true" /> {d.back}
        </Link>
        <p className="brief-tags">
          <span className={`chip chip-${sev}`}>{d[`sev${sev}`]}</span>
          <span className="store-tag">{issue.store_id}</span>
          <span className="lever-tag">{d[issue.lever]}</span>
        </p>
        {issue.rupees_at_stake > 0 && (
          <p className="problem-figure">
            {inr(issue.rupees_at_stake)}
            <span className="problem-figure-label">{d.atStake}</span>
          </p>
        )}
      </div>

      <section className="section-tight" aria-labelledby="what-title">
        <h2 id="what-title">
          <span className="step-num" aria-hidden="true">1</span> {d.whatsWrong}
        </h2>
        <p className="problem-cause" lang={words.cause.lang}>
          {words.cause.text}
        </p>
        <FollowupBadge issue={issue} compact />
      </section>

      <section className="section-tight" aria-labelledby="proof-title">
        <h2 id="proof-title">
          <span className="step-num" aria-hidden="true">2</span> {d.proof}
        </h2>
        <details className="evidence-toggle">
          <summary className="btn btn-secondary">{d.seeEvidence}</summary>
          {lang !== "en" && <p className="muted small">{d.evidenceEnglish}</p>}
          <div lang="en">
            <EvidencePanel issue={issue} showCardLink={false} />
          </div>
        </details>
      </section>

      <section className="section-tight" aria-labelledby="do-title">
        <h2 id="do-title">
          <span className="step-num" aria-hidden="true">3</span> {d.whatToDo}
        </h2>
        <p className="action-box" lang={words.action.lang}>
          {words.action.text}
        </p>
      </section>

      <section className="section-tight" aria-labelledby="card-title">
        <h2 id="card-title">
          <span className="step-num" aria-hidden="true">4</span> {d.actionCard}
        </h2>
        {card ? (
          <div className="phone">
            <div className="phone-notch" aria-hidden="true" />
            <p className="phone-app">Store Coach</p>
            <p className="recipient">
              {d.forWhom}: {recipient.includes(issue.store_id) ? recipient : `${recipient}, ${issue.store_id}`}
            </p>
            <p className="card-copy" lang={card.lang}>
              {card.text}
            </p>
            <p className="trust-line small">
              <ShieldCheck size={16} aria-hidden="true" /> {d.numberCheck}
              {card.fellBack && <span className="muted"> · {d.englishOnly}</span>}
            </p>
            <ShareButtons text={card.text} copyLabel={d.copy} shareLabel={d.share} copied={d.copied} />
            <p className="muted small">{d.shareNote}</p>
          </div>
        ) : (
          <p className="state" lang={words.action.lang}>
            {words.action.text}
          </p>
        )}
        <Link className="btn btn-ghost" href={cardHref(issue)}>
          {d.fullCard} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

const Fallback = () => (
  <main className="shell page" role="status" aria-label="Loading">
    <div className="skeleton" style={{ height: 160 }} />
  </main>
);

export default function Page(props: Props) {
  return (
    <Suspense fallback={<Fallback />}>
      <ProblemPage {...props} />
    </Suspense>
  );
}
