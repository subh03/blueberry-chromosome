// Run: npx tsx --test app/api/_lib/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateJson } from "./gemini";

const ok = (obj: unknown) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }), { status: 200 });
const base = { apiKey: "k", model: "m", prompt: "p", schema: { type: "OBJECT" }, signal: new AbortController().signal };

test("generateJson retries once after a failure and returns the parsed JSON", async () => {
  let calls = 0;
  const fetchImpl = async () => (++calls === 1 ? new Response("busy", { status: 503 }) : ok({ text: "hi" }));
  assert.deepEqual(await generateJson({ ...base, fetchImpl }), { text: "hi" });
  assert.equal(calls, 2);
});

test("generateJson gives up after the second failure", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return new Response("busy", { status: 503 }); };
  await assert.rejects(generateJson({ ...base, fetchImpl }), /503/);
  assert.equal(calls, 2);
});

test("generateJson does not retry once the deadline has aborted the call", async () => {
  const controller = new AbortController();
  let calls = 0;
  const fetchImpl = async () => { calls++; controller.abort(); throw new DOMException("aborted", "AbortError"); };
  await assert.rejects(generateJson({ ...base, signal: controller.signal, fetchImpl }));
  assert.equal(calls, 1);
});

test("generateJson sends the model, key header and JSON response config", async () => {
  let seen: { url: string; init: RequestInit } | undefined;
  const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => { seen = { url: String(url), init: init! }; return ok({}); };
  await generateJson({ ...base, fetchImpl });
  assert.match(seen!.url, /\/models\/m:generateContent$/);
  assert.equal((seen!.init.headers as Record<string, string>)["x-goog-api-key"], "k");
  const body = JSON.parse(String(seen!.init.body));
  assert.equal(body.generationConfig.responseMimeType, "application/json");
  assert.deepEqual(body.generationConfig.responseSchema, { type: "OBJECT" });
});
