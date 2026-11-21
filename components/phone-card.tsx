"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import type { ActionCard } from "@/types";
import { getCard, type UiData } from "@/lib/ui/data";
import { DataSourceLabel } from "@/components/data-source-label";
import { Button } from "@/components/ui/button";
import { CardRejection, RejectedDraft } from "@/components/card-rejection";

export function PhoneCard({
  cardId,
  issueId,
  audience = "salesperson",
}: {
  cardId: string;
  issueId?: string;
  audience?: ActionCard["audience"];
}) {
  const [card, setCard] = useState<UiData<ActionCard> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getCard(cardId, issueId, audience)
      .then((data) => {
        if (active) setCard(data);
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
  }, [cardId, issueId, audience, attempt]);
  const words = card?.text.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const overLimit = card?.audience === "salesperson" && words > 60;
  return (
    <main className="coach-shell" id="main-content">
      <header className="masthead">
        <Link href="/" className="brand">
          Manyavar <span>Store Coach</span>
        </Link>
        <Link href="/">Back to evidence</Link>
      </header>
      <div className="page-heading">
        <div>
          <h1>One action for today</h1>
          <p>The card and the evidence behind its words.</p>
        </div>
        <p className="snapshot">
          <DataSourceLabel source={card?.dataSource} />
        </p>
      </div>
      {loading ? (
        <p role="status" className="state">
          Loading the action card…
        </p>
      ) : error ? (
        <div className="state" role="alert">
          <p>
            The action card couldn’t load. Open it from an evidence chain or try
            again.
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
      ) : !card ? (
        <div className="state">
          <p>No card is available for this issue yet.</p>
          <Link className="text-link" href="/">
            Choose another store problem
          </Link>
        </div>
      ) : (
        <div className="card-layout">
          <section className="phone-frame" aria-label="Phone preview">
            <div className="phone-top" aria-hidden="true" />
            <div className="phone-content">
              <p className="phone-brand">Store Coach</p>
              <h2>
                {card.audience === "salesperson"
                  ? "On the floor today"
                  : "For your stores"}
              </h2>
              <p className="recipient">
                {card.salesperson_id ?? "Area manager"}
              </p>
              {overLimit ? (
                <p role="alert">
                  This draft exceeds the 60-word limit and needs regeneration.
                </p>
              ) : (
                <CardRejection card={card} />
              )}
              <p className="card-meta">
                {words} words ·{" "}
                {card.source === "template" ? "Template" : "Gemini"}
              </p>
            </div>
          </section>
          <aside className="card-audit" aria-label="Card provenance">
            <h2>Card provenance</h2>
            <dl>
              <dt>Source</dt>
              <dd>{card.source === "gemini" ? "Gemini" : "Template"}</dd>
              <dt>
                {card.rejected_draft
                  ? "Rejected draft validation"
                  : "Validator result"}
              </dt>
              <dd>{card.validation.passed ? "Passed" : "Failed"}</dd>
              <dt>
                {card.rejected_draft
                  ? "Rejected draft word count"
                  : "Validator word count"}
              </dt>
              <dd>{card.validation.word_count}</dd>
            </dl>
            {card.source === "template" && !card.validation.passed && (
              <p className="trust-beat">
                AI draft had an invented number. Rejected. Template used.
              </p>
            )}
            {card.rejected_draft && (
              <section className="draft">
                <h3>Rejected AI draft</h3>
                <blockquote>
                  <RejectedDraft
                    text={card.rejected_draft}
                    tokens={card.validation.rejected_numbers}
                  />
                </blockquote>
                {card.validation.rejected_numbers.length > 0 && (
                  <p className="rejection-stamp">
                    {`Rejected: ${card.validation.rejected_numbers.join(", ")} ${card.validation.rejected_numbers.length > 1 ? "are" : "is"} not in the evidence`}
                  </p>
                )}
                <p>
                  The supplied card uses the {card.source} source. For a
                  template card, the validation above describes this rejected
                  draft.
                </p>
              </section>
            )}
            {card.validation.reasons.length > 0 && (
              <ul>
                {card.validation.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
            {card.validation.rejected_numbers.length > 0 && (
              <p>
                Rejected numbers · {card.validation.rejected_numbers.join(", ")}
              </p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
