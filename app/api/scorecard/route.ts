// GET /api/scorecard -> { as_of, title, note, store_rupees_at_stake, market_rupees_at_stake,
//                         biggest_issue_id, rows: ScorecardRow[] (with kind + reason), source: "generated" }
// Served from data/generated/scorecard.json, committed by `npm run load` from the same run that fills the
// issues table. The market note (city_slowdown) is kept out of store_rupees_at_stake.
import generated from "@/data/generated/scorecard.json";
import { scorecardBody, type GeneratedScorecard } from "@/lib/db/scorecard-body";

const body = scorecardBody(generated as GeneratedScorecard);

export async function GET() {
  return Response.json(body);
}
