// /api/scorecard response from data/generated/scorecard.json (written by `npm run load` from the same
// run that fills Supabase). `source: "generated"` says so honestly: it is neither a live DB read nor sample data.
import type { ScorecardRow } from "@/types";

export interface GeneratedScorecard {
  _note?: string;
  as_of: string;
  title: string;
  store_rupees_at_stake: number;
  market_rupees_at_stake: number;
  biggest_issue_id: string | null;
  note: string;
  rows: unknown[];
}

export interface ScorecardBody extends Omit<GeneratedScorecard, "_note" | "rows"> {
  rows: ScorecardRow[];
  source: "generated";
}

export function scorecardBody(generated: GeneratedScorecard): ScorecardBody {
  const { _note, rows, ...rest } = generated;
  void _note;
  return { ...rest, rows: rows as ScorecardRow[], source: "generated" };
}
