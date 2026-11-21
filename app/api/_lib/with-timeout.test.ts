// Run: npx tsx --test app/api/_lib/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { aiTimeoutMs } from "./with-timeout";

test("aiTimeoutMs never exceeds 8000 ms (the browser gives up at 10 s) and defaults to 8000", () => {
  const prev = process.env.AI_TIMEOUT_MS;
  process.env.AI_TIMEOUT_MS = "15000";
  assert.equal(aiTimeoutMs(), 8000);
  process.env.AI_TIMEOUT_MS = "3000";
  assert.equal(aiTimeoutMs(), 3000);
  process.env.AI_TIMEOUT_MS = "nope";
  assert.equal(aiTimeoutMs(), 8000);
  process.env.AI_TIMEOUT_MS = prev;
});
