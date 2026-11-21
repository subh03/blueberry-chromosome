"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import type { AmBrief } from "@/types";
import { getBrief, usesSample } from "@/lib/ui/data";
import { Button } from "@/components/ui/button";
import { EvidenceChain } from "@/components/evidence-chain";

export function ManagerBrief({ amId }: { amId: string }) {
  const [brief, setBrief] = useState<AmBrief | null>(null);
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
    <main className="coach-shell" id="main-content">
      <header className="masthead">
        <Link href="/" className="brand">
          Manyavar <span>Store Coach</span>
        </Link>
        <Link href="/">All store problems</Link>
      </header>
      <div className="page-heading">
        <div>
          <h1>The weekly brief</h1>
          <p>{brief ? `${brief.name} · ${brief.city}` : amId}</p>
        </div>
        <p className="snapshot">
          {usesSample && "Illustrative sample"}
          <br />
          {brief?.as_of}
        </p>
      </div>
      {loading ? (
        <p role="status" className="state">
          Loading this manager’s brief…
        </p>
      ) : error ? (
        <div role="alert" className="state">
          <p>
            This manager’s brief is unavailable. Try again or return to the
            scorecard.
          </p>
          <Button
            onClick={() => {
              setLoading(true);
              setError(false);
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          <h2>Priorities by rupees at stake</h2>
          {brief?.market_note && (
            <p className="market-note">{brief.market_note}</p>
          )}
          {issues.length === 0 ? (
            <p className="state">No store issues need attention this week.</p>
          ) : (
            <ol className="brief-list">
              {issues.map((issue) => (
                <li key={issue.id}>
                  <div className="section-heading">
                    <h3>{issue.store_id}</h3>
                    <strong
                      className="money"
                      title="28-day opportunity calculated by the problem engine"
                    >
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(issue.rupees_at_stake)}
                    </strong>
                  </div>
                  <p className="lever">{issue.lever.replaceAll("_", " ")}</p>
                  <p>{issue.cause}</p>
                  <p className="action-copy">
                    <strong>{issue.action.who}</strong>
                    <br />
                    {issue.action.what}
                    <br />
                    {issue.action.when}
                  </p>
                  <details>
                    <summary>See the evidence</summary>
                    <EvidenceChain issue={issue} />
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
