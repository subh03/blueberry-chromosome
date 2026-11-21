import { FileSearch, ShieldCheck, Smartphone } from "lucide-react";
import type { DataQualityFlag, Issue, ScorecardRow } from "@/types";
import scorecardJson from "@/data/generated/scorecard.json";
import issuesJson from "@/data/generated/issues.json";
import flagsJson from "@/data/generated/dq-flags.json";
import cardAuditJson from "@/data/generated/card-semantic-audit.after.json";
import { HeroFigure, OpenBiggestButton } from "@/components/home-hero";
import { ProblemList, type ProblemItem } from "@/components/problem-list";
import { EvidencePanel } from "@/components/evidence-panel";
import { inr, isMarketNote, isStoreRow } from "@/lib/ui/home";

// First paint is real content: the committed output of `npm run load`, read at build time.
const scorecard = scorecardJson as unknown as {
  as_of: string;
  store_rupees_at_stake: number;
  market_rupees_at_stake: number;
  biggest_issue_id: string;
  rows: ScorecardRow[];
};
const issues = (issuesJson as unknown as { issues: Issue[] }).issues;
const flags = flagsJson as unknown as DataQualityFlag[];
const cardAudit = cardAuditJson as unknown as { cards: number; failed: number };

// Rows read by the first full load (README, "On the first full load it read 388,618 rows").
const ROWS_READ = 388618;

const issueById = new Map(issues.map((issue) => [issue.id, issue]));
const withIssue = (row: ScorecardRow): ProblemItem => ({
  row,
  issue: row.top_issue_id ? (issueById.get(row.top_issue_id) ?? null) : null,
});

const storeProblems = scorecard.rows
  .filter((row) => isStoreRow(row) && row.status === "found" && (row.rupees_at_stake ?? 0) > 0)
  .sort((a, b) => (b.rupees_at_stake ?? 0) - (a.rupees_at_stake ?? 0))
  .map(withIssue);
const roleModels = scorecard.rows
  .filter((row) => row.type === "role_model" && row.status === "found")
  .map(withIssue);
const marketRows = scorecard.rows.filter((row) => isMarketNote(row) && row.status === "found");
const storeTotal = storeProblems.reduce((sum, item) => sum + (item.row.rupees_at_stake ?? 0), 0);
const biggest = storeProblems.find((item) => item.issue)?.issue ?? null;

const statusWord = (row: ScorecardRow) =>
  row.status === "data_issue"
    ? "Data issue, set aside"
    : row.status === "not_found"
      ? "Checked, not found"
      : isMarketNote(row)
        ? "Market note"
        : row.type === "role_model"
          ? "Found, a role model"
          : "Found, with evidence";

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <h1 id="hero-title" className="enter enter-1">
              Finds what&rsquo;s going wrong in your stores and tells each person
              what to do today.
            </h1>
            <div className="enter enter-2">
              <HeroFigure value={storeTotal} />
              <p className="hero-sub">
                at stake over the next 28 days, across {storeProblems.length} store
                problems · synthetic data supplied by the organisers
              </p>
            </div>
            <div className="hero-actions enter enter-3">
              {biggest && <OpenBiggestButton issueId={biggest.id} />}
              <a className="btn btn-ghost-light" href="#how-it-works">
                How it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section shell" aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <ol className="steps">
          <li>
            <FileSearch className="step-icon" size={28} aria-hidden="true" />
            <h3>Find</h3>
            <p>
              Reads {ROWS_READ.toLocaleString("en-IN")} rows of store data and
              checks every store for the problems in the brief.
            </p>
          </li>
          <li>
            <ShieldCheck className="step-icon" size={28} aria-hidden="true" />
            <h3>Prove</h3>
            <p>
              Every number traces back to the evidence. Checked in code, not by
              AI.
            </p>
          </li>
          <li>
            <Smartphone className="step-icon" size={28} aria-hidden="true" />
            <h3>Act</h3>
            <p>
              A 60-word action card for the person who needs it, on their phone.
            </p>
          </li>
        </ol>
      </section>

      <section id="problems" className="section shell" aria-labelledby="problems-title">
        <div className="section-head">
          <h2 id="problems-title">Top problems, biggest first</h2>
          <p className="muted">
            Data as of{" "}
            {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(
              new Date(scorecard.as_of),
            )}
            . Open one to see the proof and today&rsquo;s
            action.
          </p>
        </div>
        <ProblemList items={storeProblems} />

        {marketRows.map((row) => {
          const issue = row.top_issue_id ? issueById.get(row.top_issue_id) : undefined;
          return (
            <aside key={row.type} className="market-note" aria-label="Market note">
              <p className="market-label">Market note</p>
              <h3>{row.brief_problem}</h3>
              {issue && <p>{issue.cause}</p>}
              <p className="muted">
                {inr(row.rupees_at_stake ?? 0)} at stake for {row.store_ids.join(", ")}.
                This is for the area manager and is not added to the store total
                above.
              </p>
              {issue && (
                <details className="trace">
                  <summary>See the evidence</summary>
                  <EvidencePanel issue={issue} showCardLink={false} />
                </details>
              )}
            </aside>
          );
        })}

        {roleModels.length > 0 && (
          <div className="also-found">
            <h3>Also found: someone to learn from</h3>
            <ProblemList items={roleModels} />
          </div>
        )}
      </section>

      <section id="how-we-checked" className="section shell" aria-labelledby="checked-title">
        <details className="checked">
          <summary>
            <span id="checked-title" className="checked-title">How we checked</span>
            <span className="muted">
              The brief&rsquo;s {scorecard.rows.length}-point checklist, the data
              we set aside, and the card checks.
            </span>
          </summary>
          <div className="checked-body">
            <p className="checked-stat">
              Cards checked: {cardAudit.cards}
              {cardAudit.failed === 0
                ? ", all passed"
                : `, ${cardAudit.cards - cardAudit.failed} passed`}
              . Every stored card was re-checked against its evidence: numbers,
              names and word count.
            </p>

            <h3>The brief&rsquo;s checklist</h3>
            <ul className="check-list">
              {scorecard.rows.map((row) => (
                <li key={row.type}>
                  <span className={`check-status check-${row.status}`}>
                    {statusWord(row)}
                  </span>
                  <strong>{row.brief_problem}</strong>
                  {row.store_ids.length > 0 && (
                    <span className="muted"> {row.store_ids.join(", ")}</span>
                  )}
                  {row.reason && <p className="check-reason">{row.reason}</p>}
                </li>
              ))}
            </ul>

            <h3>Data we set aside</h3>
            <p className="muted">
              These never become alerts. They are excluded or qualified first.
            </p>
            <ul className="check-list">
              {flags.map((flag) => (
                <li key={flag.id}>
                  <strong>{flag.store_id ?? "Across the dataset"}</strong>
                  <p className="check-reason">
                    {flag.detail} ({flag.rows_affected.toLocaleString("en-IN")} rows
                    affected, no manager alert)
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </section>
    </main>
  );
}
