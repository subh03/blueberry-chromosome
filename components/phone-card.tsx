"use client";

import { useEffect, useState } from "react";
import type { ActionCard } from "@/types";
import { getCard, usesSample } from "@/lib/ui/data";
import { Button } from "@/components/ui/button";

export function PhoneCard({ cardId, issueId }: { cardId: string; issueId?: string }) {
  const [card, setCard] = useState<ActionCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    getCard(cardId, issueId).then((data) => { if (active) setCard(data); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cardId, issueId, attempt]);
  const words = card?.text.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const overLimit = card?.audience === "salesperson" && words > 60;
  return <main className="coach-shell" id="main-content">
    <header className="masthead"><a href="/" className="brand">Manyavar <span>Store Coach</span></a><a href="/">Back to evidence →</a></header>
    <div className="page-heading"><div><h1>One action for today</h1><p>The card and the evidence behind its words.</p></div><p className="snapshot">{usesSample && "Illustrative sample"}</p></div>
    {loading ? <p role="status" className="state">Loading the action card…</p> : error ? <div className="state" role="alert"><p>The action card couldn’t load. Open it from an evidence chain or try again.</p><Button onClick={() => setAttempt(attempt + 1)}>Try again</Button></div> : !card ? <p className="state">No card is available for this issue yet.</p> : <div className="card-layout">
      <section className="phone-frame" aria-label="Phone preview"><div className="phone-top" aria-hidden="true" /><div className="phone-content"><p className="phone-brand">Store Coach</p><h2>{card.audience === "salesperson" ? "On the floor today" : "For your stores"}</h2><p className="recipient">{card.salesperson_id ?? "Area manager"}</p>{overLimit ? <p role="alert">This draft exceeds the 60-word limit and needs regeneration.</p> : <p className="card-copy">{card.text}</p>}<p className="card-meta">{words} words · {card.source === "template" ? "Template" : "Gemini"}</p></div></section>
      <aside className="card-audit" aria-label="Card provenance"><h2>Why you can trust this card</h2><dl><dt>Source</dt><dd>{card.source === "gemini" ? "Gemini" : "Template"}</dd><dt>Validator result</dt><dd>{card.validation.passed ? "Passed" : "Failed"}</dd><dt>Validator word count</dt><dd>{card.validation.word_count}</dd></dl>
        {card.source === "template" && !card.validation.passed && <p className="trust-beat">AI draft had an invented number. Rejected. Template used.</p>}
        {card.rejected_draft && <section className="draft"><h3>Rejected AI draft</h3><blockquote>{card.rejected_draft}</blockquote><p>The supplied card uses the {card.source} source. Its validator result is shown above.</p></section>}
        {card.validation.reasons.length > 0 && <ul>{card.validation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
        {card.validation.rejected_numbers.length > 0 && <p>Rejected numbers · {card.validation.rejected_numbers.join(", ")}</p>}
      </aside>
    </div>}
  </main>;
}
