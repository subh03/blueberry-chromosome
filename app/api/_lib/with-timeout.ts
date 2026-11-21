// Runs `fn` with a deadline. On timeout the AbortSignal fires (so fetch-based AI calls stop)
// and the promise rejects with a TimeoutError. Callers fall back to the template card.
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed out after ${ms} ms`);
    this.name = "TimeoutError";
  }
}

export async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(ms));
    }, ms);
  });
  try {
    return await Promise.race([fn(controller.signal), deadline]);
  } finally {
    clearTimeout(timer);
  }
}

const MAX_AI_MS = 8000; // the browser aborts /api/card at 10 s, so the template must arrive before that

/** AI_TIMEOUT_MS from env, capped at 8000; 8000 when missing or invalid. */
export function aiTimeoutMs(): number {
  const ms = Number(process.env.AI_TIMEOUT_MS);
  return Number.isFinite(ms) && ms > 0 ? Math.min(ms, MAX_AI_MS) : MAX_AI_MS;
}
