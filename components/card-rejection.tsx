"use client";

import { useEffect, useRef } from "react";
import type { ActionCard } from "@/types";
import { cardDraftOrigin } from "@/lib/ui/data";

export function RejectedDraft({
  text,
  tokens,
}: {
  text: string;
  tokens: string[];
}) {
  const escaped = tokens
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = escaped.length
    ? text.split(new RegExp(`(${escaped.join("|")})`, "g"))
    : [text];
  return (
    <>
      {parts.map((part, index) =>
        tokens.includes(part) ? (
          <span key={index} className="rejected-number">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function CardRejection({ card, replay = true }: { card: ActionCard; replay?: boolean }) {
  const sequence = useRef<HTMLDivElement>(null);
  const hasRejection =
    Boolean(card.rejected_draft);
  const origin = cardDraftOrigin(card);
  // Replay is genuine only for a real Gemini draft; the injected stress test keeps its own label.
  const replayLabel =
    origin === "injected_test"
      ? "Stress test: injected draft, not written by Gemini"
      : origin === "gemini"
        ? card.source === "template"
          ? "Gemini draft rejected by our checks, template used"
          : "Gemini draft rejected by our checks, a later draft passed"
        : "Draft rejected by our checks";
  const rejected = card.validation.rejected_numbers.filter(
    (token) => token && card.rejected_draft?.includes(token),
  );
  const stamp = rejected.length ? `Rejected: ${rejected.join(", ")} ${rejected.length > 1 ? "are" : "is"} not in the evidence` : "Draft rejected by the validator";
  const play = () => {
    const element = sequence.current;
    if (!element) return;
    element
      .getAnimations({ subtree: true })
      .forEach((animation) => animation.cancel());
    element.removeAttribute("data-playing");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Commit the final state before restarting the CSS sequence on Replay.
    void element.offsetWidth;
    element.setAttribute("data-playing", "true");
  };
  useEffect(() => {
    if (!hasRejection) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const element = sequence.current;
    const finish = () => {
      element?.removeAttribute("data-playing");
      element
        ?.getAnimations({ subtree: true })
        .forEach((animation) => animation.cancel());
    };
    media.addEventListener("change", finish);
    return () => {
      finish();
      media.removeEventListener("change", finish);
    };
  }, [hasRejection]);

  return (
    <>
      <div className="card-sequence" ref={sequence}>
        {hasRejection && (
          <div className="animated-draft" aria-hidden="true">
            <p className="card-copy">
              <RejectedDraft text={card.rejected_draft!} tokens={rejected} />
            </p>
            <p className="rejection-stamp">{stamp}</p>
          </div>
        )}
        <div className="template-card">
          <p className="card-copy">{card.text}</p>
          {hasRejection && (
            <p className="template-footer">{replayLabel}</p>
          )}
        </div>
      </div>
      {hasRejection && replay && (
        <button className="replay-button" onClick={play}>
          Replay
        </button>
      )}
    </>
  );
}
