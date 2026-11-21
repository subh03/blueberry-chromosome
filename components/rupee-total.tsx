"use client";

import { useEffect, useRef } from "react";

export function RupeeTotal({
  value,
  problems,
}: {
  value: number;
  problems: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const figure = useRef<HTMLSpanElement>(null);
  const formatted = `₹${value.toLocaleString("en-IN")}`;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let played = false;
    try {
      played = sessionStorage.getItem("store-coach-home-intro") === "played";
    } catch {
      // Storage may be unavailable in private browser contexts.
    }
    if (played || media.matches) return;
    const section = container.current?.closest("section");
    if (section) section.setAttribute("data-intro", "playing");
    const duration =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--t-count",
        ),
      ) || 900;
    let start: number | undefined;
    let frame = 0;
    const finish = () => {
      cancelAnimationFrame(frame);
      if (figure.current) figure.current.textContent = formatted;
      section?.removeAttribute("data-intro");
    };
    const tick = (now: number) => {
      if (start === undefined) {
        start = now;
        try {
          sessionStorage.setItem("store-coach-home-intro", "played");
        } catch {
          /* Counting works without storage. */
        }
      }
      const progress = Math.min((now - start) / duration, 1);
      // Resolve the design's cubic-bezier(.23, 1, .32, 1) at this time.
      let low = 0;
      let high = 1;
      for (let iteration = 0; iteration < 12; iteration += 1) {
        const t = (low + high) / 2;
        const x =
          3 * 0.23 * (1 - t) ** 2 * t + 3 * 0.32 * (1 - t) * t ** 2 + t ** 3;
        if (x < progress) low = t;
        else high = t;
      }
      const eased = 1 - (1 - (low + high) / 2) ** 3;
      if (figure.current)
        figure.current.textContent = `₹${Math.round(value * eased).toLocaleString("en-IN")}`;
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    frame = requestAnimationFrame(tick);
    media.addEventListener("change", finish);
    return () => {
      finish();
      media.removeEventListener("change", finish);
    };
  }, [value, formatted]);

  return (
    <div
      className="rupee-total"
      ref={container}
      role="group"
      aria-label={`${formatted} at stake across ${problems} problems`}
    >
      <strong className="rupee-hero">
        <span className="sr-only">{formatted}</span>
        <span aria-hidden="true" ref={figure}>
          {formatted}
        </span>
      </strong>
      <p>At stake across {problems} problems</p>
    </div>
  );
}
