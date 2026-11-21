// POST /api/card { issue_id: string, audience?: "am" | "salesperson" } -> ActionCard (types/index.ts)
// The AI step always runs under the AI_TIMEOUT_MS (8 s) deadline. Timeout or any failure
// returns the template card, so the screen is never blank.
// STUB: both paths read data/sample/cards.json. Naman replaces generateCard (Gemini + validator)
// and templateCard (engine templates); the timeout and fallback wiring stays.
import type { ActionCard } from "@/types";
import sample from "@/data/sample/cards.json";
import { aiTimeoutMs, withTimeout } from "../_lib/with-timeout";
import { jsonError } from "../_lib/json";

type Audience = ActionCard["audience"];
interface CardRequest {
  issue_id: string;
  audience: Audience;
}

const cards = sample.cards as ActionCard[];

function parse(body: unknown): CardRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const { issue_id, audience = "salesperson" } = body as Record<string, unknown>;
  if (typeof issue_id !== "string" || issue_id.length === 0 || issue_id.length > 200) return null;
  if (audience !== "am" && audience !== "salesperson") return null;
  return { issue_id, audience };
}

function pick(req: CardRequest, source: ActionCard["source"]): ActionCard {
  const base =
    cards.find((c) => c.issue_id === req.issue_id && c.audience === req.audience) ??
    cards.find((c) => c.audience === req.audience) ??
    cards[0];
  return { ...base, issue_id: req.issue_id, audience: req.audience, source, created_at: new Date().toISOString() };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateCard(req: CardRequest, signal: AbortSignal): Promise<ActionCard> {
  // TODO(Naman): Gemini call with `signal`, then the number validator. Throw if it fails validation.
  return pick(req, "gemini");
}

function templateCard(req: CardRequest): ActionCard {
  return pick(req, "template");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Body must be JSON: { issue_id, audience? }");
  }
  const req = parse(body);
  if (!req) return jsonError(400, "issue_id (string) is required; audience is 'am' or 'salesperson'");

  try {
    return Response.json(await withTimeout((signal) => generateCard(req, signal), aiTimeoutMs()));
  } catch (err) {
    console.warn("[api/card] AI step failed, using template:", err instanceof Error ? err.message : err);
    return Response.json(templateCard(req));
  }
}
