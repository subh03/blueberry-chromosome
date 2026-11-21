"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="coach-shell" id="main-content">
      <h1>The page couldn’t load</h1>
      <p>Try loading the store data again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
