// Run: npx tsx --test app/api/_lib/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Issue } from "@/types";
import { makeCard, type AiStep } from "./make-card";

const issue = {
  id: "i1", cause: "c", action: { who: "SM", what: "do", when: "now" },
  evidence: { allowedNumbers: ["11.0%"] },
} as unknown as Issue;

const reply = (text: string) => async () =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ text }) }] } }] }));

function step(validTexts: string[]): AiStep {
  return {
    buildPrompt: () => "p",
    schema: {},
    toText: (j) => (j as { text: string }).text,
    validate: (text) => ({ passed: validTexts.includes(text), word_count: 1, rejected_numbers: validTexts.includes(text) ? [] : ["99%"], reasons: [] }),
  };
}
const env = { apiKey: "k", model: "m", timeoutMs: 1000 };

test("makeCard returns the Gemini card when the validator passes", async () => {
  const card = await makeCard(issue, "salesperson", { ...env, aiStep: step(["good"]), fetchImpl: reply("good") });
  assert.equal(card.source, "gemini");
  assert.equal(card.text, "good");
});

test("makeCard retries a rejected draft once, then falls back to the template and keeps the rejected draft", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return reply("bad 99%")(); };
  const card = await makeCard(issue, "salesperson", { ...env, aiStep: step([]), fetchImpl });
  assert.equal(calls, 2);
  assert.equal(card.source, "template");
  assert.equal(card.rejected_draft, "bad 99%");
  assert.deepEqual(card.validation.rejected_numbers, ["99%"]);
});

test("makeCard uses the template when no AI step is wired yet", async () => {
  const card = await makeCard(issue, "am", { ...env, aiStep: null, fetchImpl: reply("x") });
  assert.equal(card.source, "template");
});

test("makeCard falls back to the template when Gemini misses the deadline", async () => {
  const hang = (_: unknown, init?: RequestInit) => new Promise<Response>((_r, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
  const card = await makeCard(issue, "salesperson", { ...env, timeoutMs: 30, aiStep: step(["x"]), fetchImpl: hang as typeof fetch });
  assert.equal(card.source, "template");
});
