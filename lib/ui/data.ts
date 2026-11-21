import type {
  ActionCard,
  AmBrief,
  DataQualityFlag,
  Issue,
  RunLog,
  ScorecardRow,
} from "@/types";
export const usesSample = process.env.NEXT_PUBLIC_USE_SAMPLE === "1";
async function readApi<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("Store data is unavailable. Please try again.");
  return response.json() as Promise<T>;
}
export async function getScorecard(): Promise<{
  as_of: string;
  rows: ScorecardRow[];
}> {
  if (usesSample)
    return (await import("@/data/sample/scorecard.json")).default as {
      as_of: string;
      rows: ScorecardRow[];
    };
  return readApi("/api/scorecard");
}
export async function getIssues(): Promise<{ issues: Issue[] }> {
  if (usesSample)
    return (await import("@/data/sample/issues.json")).default as {
      issues: Issue[];
    };
  return readApi("/api/issues");
}
export async function getBrief(amId: string): Promise<AmBrief> {
  if (usesSample) {
    const brief = (await import("@/data/sample/am-brief.json"))
      .default as AmBrief;
    if (brief.area_manager_id !== amId)
      throw new Error("No sample brief is available for this manager.");
    return brief;
  }
  return readApi(`/api/brief?amId=${encodeURIComponent(amId)}`);
}
export async function getCards(): Promise<{ cards: ActionCard[] }> {
  if (usesSample)
    return (await import("@/data/sample/cards.json")).default as {
      cards: ActionCard[];
    };
  return readApi("/api/card");
}
export async function getFlags(): Promise<{ flags: DataQualityFlag[] }> {
  if (usesSample)
    return (await import("@/data/sample/dq-flags.json")).default as {
      flags: DataQualityFlag[];
    };
  return readApi("/api/dq-flags");
}
export async function getRuns(): Promise<{ runs: RunLog[] }> {
  if (usesSample)
    return (await import("@/data/sample/run-log.json")).default as {
      runs: RunLog[];
    };
  return readApi("/api/run-log");
}
