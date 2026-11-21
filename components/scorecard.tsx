"use client";
import Link from "next/link";
import { useEffect, useState, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { EvidenceChain } from "@/components/evidence-chain";
import { DataQualityStrip } from "@/components/data-quality-strip";
import { RunLogStrip } from "@/components/run-log-strip";
import { getScorecard, getIssues, usesSample } from "@/lib/ui/data";
import type { Issue, ScorecardRow } from "@/types";
import { RupeeTotal } from "@/components/rupee-total";
import type { CSSProperties } from "react";
export function Scorecard({
  initialScorecard,
  initialIssues = [],
}: {
  initialScorecard?: { as_of: string; rows: ScorecardRow[] };
  initialIssues?: Issue[];
}) {
  const [rows, setRows] = useState<ScorecardRow[]>(
    initialScorecard?.rows ?? [],
  );
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [asOf, setAsOf] = useState(initialScorecard?.as_of ?? "");
  const [loading, setLoading] = useState(!initialScorecard);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    if (initialScorecard && attempt === 0) return;
    let active = true;
    Promise.all([getScorecard(), getIssues()])
      .then(([scorecard, evidence]) => {
        if (!active) return;
        setRows(scorecard.rows);
        setAsOf(scorecard.as_of);
        setIssues(evidence.issues);
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
  }, [attempt, initialScorecard]);
  return (
    <main className="coach-shell" id="main-content">
      <header className="masthead">
        <Link href="/" className="brand">
          Manyavar <span>Store Coach</span>
        </Link>
        <Link href="/am/AM-01">Weekly brief</Link>
      </header>
      <div className="page-heading">
        <div>
          <h1>The store brief</h1>
          <p>
            Which stores need attention, and the evidence behind each problem.
          </p>
        </div>
        <p className="snapshot">
          {usesSample ? "Illustrative sample" : "Store data"}
          {asOf && (
            <>
              <br />
              As of {asOf}
            </>
          )}
        </p>
      </div>
      <section aria-labelledby="scorecard-title">
        {!loading && !error && rows.length > 0 && (
          <RupeeTotal
            value={rows.reduce(
              (total, row) => total + (row.rupees_at_stake ?? 0),
              0,
            )}
            problems={rows.filter((row) => row.status === "found").length}
          />
        )}
        <div className="section-heading">
          <h2 id="scorecard-title">The brief’s checklist</h2>
          <p>Tap a row to see its evidence.</p>
        </div>
        {loading ? (
          <p role="status" className="state">
            Loading the store brief…
          </p>
        ) : error ? (
          <div role="alert" className="state">
            <p>The store brief couldn’t load.</p>
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
        ) : rows.length === 0 ? (
          <p className="state">
            No problems have been checked for this snapshot.
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Problem from the brief</th>
                  <th scope="col">Store</th>
                  <th scope="col">₹ at stake</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const issue = issues.find(
                    (item) => item.id === row.top_issue_id,
                  );
                  const expanded = open === row.type;
                  return (
                    <Fragment key={row.type}>
                      <tr
                        className="scorecard-row"
                        style={
                          {
                            "--row-delay": `${[0, 40, 70, 90, 105, 115][Math.min(index, 5)]}ms`,
                          } as CSSProperties
                        }
                      >
                        <th scope="row">
                          <button
                            className="row-trigger"
                            aria-expanded={expanded}
                            aria-controls={`evidence-${row.type}`}
                            onClick={() => setOpen(expanded ? null : row.type)}
                          >
                            {row.brief_problem}
                            <span aria-hidden="true">
                              {expanded ? "−" : "+"}
                            </span>
                          </button>
                        </th>
                        <td>{row.store_ids.join(", ") || "—"}</td>
                        <td className="money">
                          {row.rupees_at_stake === null
                            ? "—"
                            : new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                              }).format(row.rupees_at_stake)}
                        </td>
                        <td>
                          <span className={`status ${row.status}`}>
                            {row.status === "found"
                              ? "Found"
                              : row.status === "data_issue"
                                ? "Data issue"
                                : "Not found"}
                          </span>
                        </td>
                      </tr>
                      <tr id={`evidence-${row.type}`} hidden={!expanded}>
                        <td colSpan={4}>
                          {expanded &&
                            (issue ? (
                              <EvidenceChain issue={issue} />
                            ) : (
                              <p className="state">
                                {row.status === "data_issue"
                                  ? "Data-quality guard applied. No manager alert."
                                  : row.status === "not_found"
                                    ? "No matching issue was found in this snapshot."
                                    : "Detailed evidence is not supplied for this sample row yet."}
                              </p>
                            ))}
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <DataQualityStrip />
      <RunLogStrip />
      <footer className="page-footer">
        Every number comes from the evidence.{" "}
        {usesSample && "Sample values are illustrative."}
      </footer>
    </main>
  );
}
