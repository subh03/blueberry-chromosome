import { Scorecard } from "@/components/scorecard";
import { Suspense } from "react";
import { headers } from "next/headers";
import { getScorecard, getIssues, usesSample } from "@/lib/ui/data";

async function StoreBrief() {
  let origin = "";
  if (!usesSample) {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host");
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    origin = `${protocol}://${host}`;
  }
  const initial = await Promise.all([
    getScorecard(origin),
    getIssues(origin),
  ]).catch(() => null);
  return (
    <Scorecard
      initialScorecard={initial?.[0]}
      initialIssues={initial?.[1].issues}
    />
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="coach-shell">
          <p role="status">Loading the store brief…</p>
        </main>
      }
    >
      <StoreBrief />
    </Suspense>
  );
}
