"use client";

import { useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { inr } from "@/lib/ui/home";

const DURATION = 900;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** The hero ₹: server-rendered final value; counts up once per session when motion is allowed. */
export function HeroFigure({ value }: { value: number }) {
  const digits = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.countup !== "armed") return;
    try {
      sessionStorage.setItem("sc-countup", "played");
    } catch {
      /* counting works without storage */
    }
    let frame = 0;
    let start: number | undefined;
    const el = digits.current;
    const finish = () => {
      cancelAnimationFrame(frame);
      if (el) el.textContent = inr(value);
      delete root.dataset.countup;
    };
    const tick = (now: number) => {
      start ??= now;
      const progress = Math.min((now - start) / DURATION, 1);
      if (el) el.textContent = inr(Math.round((value * easeOut(progress)) / 100) * 100);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    if (el) el.textContent = inr(0);
    root.dataset.countup = "playing";
    frame = requestAnimationFrame(tick);
    return finish;
  }, [value]);
  return (
    <p className="hero-figure">
      <span className="sr-only">{inr(value)} at stake</span>
      <span className="hero-digits" aria-hidden="true" ref={digits}>
        {inr(value)}
      </span>
    </p>
  );
}

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
