// Minimal Gemini REST client: structured JSON output, one retry, abortable by the caller's deadline.
// Server-only: it needs GEMINI_API_KEY.
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GenerateJsonInput {
  apiKey: string;
  model: string;
  prompt: string;
  schema: object; // Gemini responseSchema (OpenAPI subset)
  signal: AbortSignal;
  fetchImpl?: typeof fetch;
}

export async function generateJson<T = unknown>(input: GenerateJsonInput): Promise<T> {
  try {
    return await once<T>(input);
  } catch (err) {
    if (input.signal.aborted) throw err; // the deadline passed: no retry
    return once<T>(input); // retry once
  }
}

async function once<T>({ apiKey, model, prompt, schema, signal, fetchImpl = fetch }: GenerateJsonInput): Promise<T> {
  const res = await fetchImpl(`${BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: schema },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text");
  return JSON.parse(text) as T;
}
