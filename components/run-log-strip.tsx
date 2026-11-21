"use client";

import { useEffect, useState } from "react";
import type { RunLog } from "@/types";
import { getRuns } from "@/lib/ui/data";
import { Button } from "@/components/ui/button";

export function RunLogStrip() {
  const [runs, setRuns] = useState<RunLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getRuns()
      .then((data) => {
        if (active) setRuns(data.runs);
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
  }, [attempt]);
  const latest = [...runs].sort((a, b) =>
    b.started_at.localeCompare(a.started_at),
  )[0];
  return (
    <section className="run-strip" aria-labelledby="run-title">
      <h2 id="run-title">Latest run</h2>
      {loading ? (
        <p role="status">Loading run log…</p>
      ) : error ? (
        <div role="alert">
          <p>Run history couldn’t load.</p>
          <Button
            onClick={() => {
              setLoading(true);
              setError(false);
              setAttempt((value) => value + 1);
            }}
          >
            Retry run history
          </Button>
        </div>
      ) : !latest ? (
        <p>No runs recorded yet.</p>
      ) : (
        <>
          <p>
            <time dateTime={latest.started_at}>
              {new Intl.DateTimeFormat("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Kolkata",
              }).format(new Date(latest.started_at))}{" "}
              IST
            </time>{" "}
            · {latest.trigger} ·{" "}
            {latest.ok
              ? latest.finished_at
                ? "Completed"
                : "In progress"
              : "Failed"}
          </p>
          <p>
            {latest.rows_read.toLocaleString("en-IN")} rows read ·{" "}
            {latest.issues} issues · {latest.cards} cards
          </p>
          <p className="run-detail">
            {latest.gemini_ok} Gemini cards · {latest.gemini_fallback} template
            fallbacks
          </p>
          {!latest.ok && (
            <p role="alert">
              This run needs attention. The last available store snapshot
              remains visible.
            </p>
          )}
        </>
      )}
    </section>
  );
}
