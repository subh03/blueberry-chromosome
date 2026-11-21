"use client";

import { useEffect, useRef } from "react";
import type { ActionCard } from "@/types";

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

export function CardRejection({ card }: { card: ActionCard }) {
  const sequence = useRef<HTMLDivElement>(null);
  const hasRejection =
    card.source === "template" &&
    Boolean(card.rejected_draft) &&
    card.validation.rejected_numbers.some(
      (token) => token && card.rejected_draft?.includes(token),
    );
  const rejected = card.validation.rejected_numbers.filter(
    (token) => token && card.rejected_draft?.includes(token),
  );
  const stamp = `Rejected: ${rejected.join(", ")} ${rejected.length > 1 ? "are" : "is"} not in the evidence`;
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
    if (!media.matches) element?.setAttribute("data-playing", "true");
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
            <p className="template-footer">
              Template used. Every number checked.
            </p>
          )}
        </div>
      </div>
      {hasRejection && (
        <button className="replay-button" onClick={play}>
          Replay
        </button>
      )}
    </>
  );
}
