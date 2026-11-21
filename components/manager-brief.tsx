"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { AmBrief } from "@/types";
import { getBrief, type UiData } from "@/lib/ui/data";
import { DataSourceLabel } from "@/components/data-source-label";
import { EvidencePanel } from "@/components/evidence-panel";
import { FollowupBadge } from "@/components/followup-badge";
import { cardHref, inr } from "@/lib/ui/home";

export function ManagerBrief({ amId }: { amId: string }) {
  const [brief, setBrief] = useState<UiData<AmBrief> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getBrief(amId)
      .then((data) => {
        if (active) setBrief(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [amId, attempt]);
  const issues = [...(brief?.issues ?? [])]
    .sort((a, b) => b.rupees_at_stake - a.rupees_at_stake)
    .slice(0, Math.min(5, brief?.max_alerts_per_week ?? 5));
  return (
    <main className="shell page" id="main-content">
      <div className="page-head">
        <h1>This week&rsquo;s brief{brief ? ` for ${brief.name}` : ""}</h1>
        <p>
          {brief ? `${brief.city} · data as of ${brief.as_of}. ` : ""}
          At most five problems a week, biggest ₹ at stake first. Synthetic data
          supplied by the organisers.
        </p>
        <DataSourceLabel source={brief?.dataSource} />
      </div>
      {loading ? (
        <div className="brief-list" role="status" aria-label="Loading this week's brief">
          {[0, 1, 2].map((key) => (
            <div key={key} className="brief-item" aria-hidden="true">
              <div className="skeleton" style={{ height: 22, width: "30%" }} />
              <div className="skeleton" style={{ height: 18, width: "85%" }} />
              <div className="skeleton" style={{ height: 18, width: "60%" }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="state">
          <p>This manager&rsquo;s brief didn&rsquo;t load. Try again, or go back to the overview.</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setLoading(true);
              setError(false);
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {brief?.market_note && (
            <aside className="market-note" aria-label="Market note" style={{ marginTop: 0, marginBottom: 24 }}>
              <p className="market-label">Market note</p>
              <p>{brief.market_note}</p>
              <p className="muted">Not one store&rsquo;s problem, so not counted as a store alert.</p>
            </aside>
          )}
          {issues.length === 0 ? (
            <div className="state" role="status">
              <p>No problems in this manager&rsquo;s brief this week.</p>
              <Link className="btn btn-secondary" href="/">
                Back to the overview
              </Link>
            </div>
          ) : (
            <ol className="brief-list">
              {issues.map((issue) => (
                <li key={issue.id} className="brief-item">
                  <div className="brief-item-head">
                    <span className="store-tag">{issue.store_id}</span>
                    <strong title="₹ at stake per 28 days, based on the last 28 days of store data, computed by the problem engine">
                      {inr(issue.rupees_at_stake)}
                      <span className="muted" style={{ fontSize: 15, fontWeight: 400 }}> at stake</span>
                    </strong>
                  </div>
                  <h2 style={{ fontSize: 21 }}>{issue.cause}</h2>
                  <FollowupBadge issue={issue} compact />
                  <p className="action-box">
                    <strong>{issue.action.who}</strong>: {issue.action.what}.{" "}
                    {issue.action.when}.
                  </p>
                  <Link className="btn btn-secondary" href={cardHref(issue)} style={{ justifySelf: "start" }}>
                    See the action card
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <details className="trace">
                    <summary>See the evidence</summary>
                    <EvidencePanel issue={issue} showCardLink={false} />
                  </details>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </main>
  );
}
