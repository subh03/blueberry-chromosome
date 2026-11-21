"use client";

import { ArrowDown } from "lucide-react";

/** Opens the biggest problem's evidence panel (the list listens for this event). */
export function OpenBiggestButton({ issueId }: { issueId: string }) {
  return (
    <a
      className="btn btn-primary btn-lg"
      href={`#problem-${encodeURIComponent(issueId)}`}
      onClick={(event) => {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("sc:open", { detail: issueId }));
      }}
    >
      See the biggest problem
      <ArrowDown size={18} aria-hidden="true" />
    </a>
  );
}
