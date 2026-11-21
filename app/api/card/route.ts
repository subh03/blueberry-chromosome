// GET  /api/card?id=<card id>                         -> ActionCard (one stored card, e.g. the stress-test card)
// POST /api/card { card_id }                          -> same as GET ?id=
// POST /api/card { issue_id, audience? }              -> ActionCard for that issue
// For an issue: the saved card (pickSavedCard), else the template card built from the issue's evidence.
// This public route never calls Gemini, so nobody can spend our Gemini quota through it.
// Issue or card not in the DB yet -> the matching sample card. DB down -> 503 (retryable), unknown -> 404.
import type { NextRequest } from "next/server";
import type { ActionCard } from "@/types";
import sample from "@/data/sample/cards.json";
import { getBrowserDb } from "@/lib/db/browser";
import { getCardById, getIssue, listCardsForIssue } from "@/lib/db/queries";
import { templateCard } from "../_lib/card";
import { parseCardId, parseCardRequest, pickSavedCard } from "../_lib/card-request";
import { jsonError } from "../_lib/json";

type Audience = ActionCard["audience"];
const sampleCards = sample.cards as ActionCard[];
const fresh = (card: ActionCard): ActionCard => ({ ...card, created_at: new Date().toISOString() });

function sampleForIssue(issueId: string, audience: Audience): ActionCard | null {
  const card = sampleCards.find((c) => c.issue_id === issueId && c.audience === audience) ?? sampleCards.find((c) => c.issue_id === issueId);
  return card ? fresh(card) : null;
}

async function cardById(id: string): Promise<Response> {
  try {
    const card = await getCardById(getBrowserDb(), id);
    if (card) return Response.json(card);
  } catch (err) {
    console.warn("[api/card] card read failed:", err instanceof Error ? err.message : err);
    const sampleCard = sampleCards.find((c) => c.id === id);
    return sampleCard ? Response.json(fresh(sampleCard)) : jsonError(503, "Store data is unavailable. Please try again.");
  }
  const sampleCard = sampleCards.find((c) => c.id === id);
  if (sampleCard) return Response.json(fresh(sampleCard));
  return jsonError(404, `We could not find card ${id}. It may have been replaced by a newer one.`);
}

async function cardForIssue(issueId: string, audience: Audience): Promise<Response> {
  let issue = null;
  let dbDown = false;
  try {
    const db = getBrowserDb();
    const saved = pickSavedCard(await listCardsForIssue(db, issueId), audience);
    if (saved) return Response.json(saved);
    issue = await getIssue(db, issueId);
  } catch (err) {
    dbDown = true;
    console.warn("[api/card] db read failed:", err instanceof Error ? err.message : err);
  }
  // Public route: never spends Gemini calls (M7). Gemini runs only in /api/run and the card scripts.
  if (issue) return Response.json(templateCard(issue, audience));

  const fallback = sampleForIssue(issueId, audience);
  if (fallback) return Response.json(fallback);
  // A database outage is retryable; only a successful read that finds nothing is a 404.
  return dbDown ? jsonError(503, "Store data is unavailable. Please try again.") : jsonError(404, `Unknown issue ${issueId}`);
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("id");
  const id = parseCardId(raw);
  if (!id) return jsonError(400, "Pass a card id: /api/card?id=<card id>");
  return cardById(id);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Body must be JSON: { issue_id, audience? } or { card_id }");
  }
  const req = parseCardRequest(body);
  if (!req) return jsonError(400, "Send either { issue_id, audience?: 'am' | 'salesperson' } or { card_id }, not both");
  return req.kind === "id" ? cardById(req.id) : cardForIssue(req.issue_id, req.audience);
}
