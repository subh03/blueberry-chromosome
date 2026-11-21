"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, ShieldCheck } from "lucide-react";
import type { ActionCard } from "@/types";
import { getCard, cardDraftOrigin, type UiData } from "@/lib/ui/data";
import { CardRejection, RejectedDraft } from "@/components/card-rejection";
import { DataSourceLabel } from "@/components/data-source-label";

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
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
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
  const origin = card ? cardDraftOrigin(card) : undefined;
  // Never call a card Gemini-written when the team edited it.
  const sourceLabel = !card
    ? ""
    : card.validation.team_edit
      ? "Gemini draft, edited by our team"
      : card.source === "template"
        ? "Checked template"
        : "Worded by Gemini";
  const copy = async () => {
    if (!card) return;
    try {
      await navigator.clipboard.writeText(card.text);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
    window.setTimeout(() => setCopied("idle"), 2000);
  };
  return (
    <main className="shell page" id="main-content">
      <Link href="/#problems" className="back-link">
        <ArrowLeft size={18} aria-hidden="true" />
        Back to the problems
      </Link>
      <div className="page-head">
        <h1>Today&rsquo;s action card</h1>
        <p>
          One thing to do today, for the person who can fix it. Synthetic data
          supplied by the organisers.
        </p>
        <DataSourceLabel source={card?.dataSource} />
      </div>
      {loading ? (
        <div className="card-layout" role="status" aria-label="Making the action card">
          <div className="phone" aria-hidden="true">
            <div className="phone-notch" />
            <div className="skeleton" style={{ height: 18, width: "40%" }} />
            <div className="skeleton" style={{ height: 30, width: "80%", marginTop: 20 }} />
            <div className="skeleton" style={{ height: 120, marginTop: 24 }} />
          </div>
          <p className="muted">Making the card from the evidence. This takes a few seconds.</p>
        </div>
      ) : error ? (
        <div className="state" role="alert">
          <p>The action card didn&rsquo;t load. Check your connection and try again.</p>
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
      ) : !card ? (
        <div className="state">
          <p>No card is available for this problem yet.</p>
          <Link className="btn btn-secondary" href="/#problems">
            Choose another problem
          </Link>
        </div>
      ) : (
        <>
          {origin === "injected_test" && (
            <p className="stress-test-note">
              Stress test: injected draft, not written by Gemini. Our team wrote
              this draft to prove the checker catches invented numbers.
            </p>
          )}
          <div className="card-layout">
            <div>
              <section className="phone" aria-label="Phone preview">
                <div className="phone-notch" aria-hidden="true" />
                <p className="phone-app">Store Coach</p>
                <h2>{card.audience === "salesperson" ? "On the floor today" : "For your stores"}</h2>
                <p className="recipient">
                  For {card.salesperson_id ?? "the area manager"}
                </p>
                {overLimit ? (
                  <p role="alert">This draft is over the 60-word limit and needs remaking.</p>
                ) : (
                  <CardRejection card={card} />
                )}
                <p className="card-meta">
                  {words} words · {sourceLabel}
                </p>
              </section>
              <div className="phone-actions">
                <button type="button" className="btn btn-primary" onClick={copy}>
                  {copied === "done" ? (
                    <Check size={18} aria-hidden="true" />
                  ) : (
                    <Copy size={18} aria-hidden="true" />
                  )}
                  {copied === "done" ? "Copied" : "Copy card text"}
                </button>
                <span role="status" className="muted">
                  {copied === "failed" ? "Copy didn’t work here. Select the text instead." : ""}
                </span>
              </div>
              <p className="trust-line">
                <ShieldCheck size={20} aria-hidden="true" />
                <span>
                  Why you can trust this card: every number in it is checked in
                  code against the evidence before it is shown.
                </span>
              </p>
            </div>
            <aside className="card-audit" aria-label="How this card was checked">
              <h2>How this card was checked</h2>
              <dl>
                <dt>Wording</dt>
                <dd>{sourceLabel}</dd>
                {card.validation.team_edit && (
                  <>
                    <dt>Why edited</dt>
                    <dd>{card.validation.team_edit.why}</dd>
                  </>
                )}
                {card.rejected_draft && (
                  <>
                    <dt>Draft source</dt>
                    <dd>
                      {origin === "injected_test"
                        ? "Injected test draft"
                        : origin === "gemini"
                          ? "Gemini"
                          : "Not supplied"}
                    </dd>
                  </>
                )}
                <dt>{card.rejected_draft ? "Rejected draft check" : "Number check"}</dt>
                <dd>{card.validation.passed ? "Passed" : "Failed"}</dd>
                <dt>{card.rejected_draft ? "Rejected draft words" : "Words"}</dt>
                <dd>{card.validation.word_count}</dd>
              </dl>
              {card.rejected_draft && (
                <section className="draft">
                  <h3>
                    {origin === "injected_test"
                      ? "The rejected test draft"
                      : origin === "gemini"
                        ? "The rejected Gemini draft"
                        : "The rejected draft"}
                  </h3>
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
                  <p className="muted">
                    {card.source === "template"
                      ? "The card shown is written from the template instead."
                      : "The card shown is a later Gemini draft that passed the check."}
                  </p>
                </section>
              )}
              {card.validation.reasons.length > 0 && (
                <ul className="check-list">
                  {card.validation.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
