"use client";

import { useEffect, useState } from "react";
import type { DataQualityFlag } from "@/types";
import { getFlags } from "@/lib/ui/data";
import { Button } from "@/components/ui/button";

export function DataQualityStrip() {
  const [flags, setFlags] = useState<DataQualityFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getFlags()
      .then((data) => {
        if (active) setFlags(data.flags);
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
  return (
    <section className="quality-strip" aria-labelledby="quality-title">
      <div className="section-heading">
        <h2 id="quality-title">Data-quality guard</h2>
        <p>Excluded or qualified before any manager alert.</p>
      </div>
      {loading ? (
        <p role="status">Loading data-quality flags…</p>
      ) : error ? (
        <div role="alert">
          <p>Data-quality flags couldn’t load.</p>
          <Button
            onClick={() => {
              setLoading(true);
              setError(false);
              setAttempt((value) => value + 1);
            }}
          >
            Retry flags
          </Button>
        </div>
      ) : flags.length === 0 ? (
        <p>No data-quality flags for this snapshot.</p>
      ) : (
        <ul>
          {flags.map((flag) => (
            <li key={flag.id}>
              <strong>{flag.store_id ?? "Across the dataset"}</strong>
              <p>{flag.detail}</p>
              <small>
                {flag.rows_affected.toLocaleString("en-IN")} rows affected · No
                manager alert
              </small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
