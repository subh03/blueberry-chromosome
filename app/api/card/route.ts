// POST /api/card { issue_id: string, audience?: "am" | "salesperson" } -> ActionCard (types/index.ts)
// A card already saved by /api/run is served as is. Otherwise, real issue in the DB -> makeCard: Gemini (GEMINI_MODEL, structured JSON, retry once) under the
// 8 s deadline, checked by the validator; any failure -> template. card.source says "gemini" or "template".
// Issue not in the DB yet (detectors not run) -> the matching sample card, so the demo flow still works.
import type { ActionCard } from "@/types";
import sample from "@/data/sample/cards.json";
import { getBrowserDb } from "@/lib/db/browser";
import { getIssue, getLatestCard } from "@/lib/db/queries";
import { makeCard } from "../_lib/make-card";
import { jsonError } from "../_lib/json";

type Audience = ActionCard["audience"];
const sampleCards = sample.cards as ActionCard[];

function parse(body: unknown): { issue_id: string; audience: Audience } | null {
  if (typeof body !== "object" || body === null) return null;
  const { issue_id, audience = "salesperson" } = body as Record<string, unknown>;
  if (typeof issue_id !== "string" || issue_id.length === 0 || issue_id.length > 200) return null;
  if (audience !== "am" && audience !== "salesperson") return null;
  return { issue_id, audience };
}

function sampleCard(issueId: string, audience: Audience): ActionCard | null {
  const card = sampleCards.find((c) => c.issue_id === issueId && c.audience === audience) ?? sampleCards.find((c) => c.issue_id === issueId);
  return card ? { ...card, created_at: new Date().toISOString() } : null;
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

  let issue = null;
  let dbDown = false;
  try {
    const db = getBrowserDb();
    // Serve the card the daily run already made, so a page view does not call Gemini again.
    const saved = await getLatestCard(db, req.issue_id, req.audience);
    if (saved) return Response.json(saved);
    issue = await getIssue(db, req.issue_id);
  } catch (err) {
    dbDown = true;
    console.warn("[api/card] db read failed:", err instanceof Error ? err.message : err);
  }
  if (issue) return Response.json(await makeCard(issue, req.audience));

  const fallback = sampleCard(req.issue_id, req.audience);
  if (fallback) return Response.json(fallback);
  // A database outage is retryable; only a successful read that finds nothing is a 404.
  return dbDown ? jsonError(503, "Store data is unavailable. Please try again.") : jsonError(404, `Unknown issue ${req.issue_id}`);
}
