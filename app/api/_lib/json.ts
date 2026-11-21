// Consistent JSON error responses: never leak raw errors to the client.
export function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/** Drops the `_note` field the sample files carry, so responses match types/index.ts exactly. */
export function stripNote<T extends { _note?: unknown }>(sample: T): Omit<T, "_note"> {
  const { _note, ...rest } = sample;
  void _note;
  return rest;
}
