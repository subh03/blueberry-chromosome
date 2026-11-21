import type {
  ActionCard,
  AmBrief,
  DataQualityFlag,
  Issue,
  RunLog,
  ScorecardRow,
} from "@/types";
export type DataSource = "sample" | "db";
export type UiData<T> = T & { dataSource?: DataSource };

export function cardDraftOrigin(card: ActionCard) {
  return card.draft_origin ?? card.validation.draft_origin ?? (
    card.id.startsWith("stress-test:") || card.rejected_draft?.startsWith("Injected test draft")
      ? "injected_test" : undefined
  );
}

export const usesSample = process.env.NEXT_PUBLIC_USE_SAMPLE === "1";
async function readApi<T>(path: string): Promise<UiData<T>> {
  const response = await fetch(path, {
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("Store data is unavailable. Please try again.");
  const body = (await response.json()) as T & { source?: unknown };
  return {
    ...body,
    dataSource:
      body.source === "sample" || body.source === "db"
        ? body.source
        : undefined,
  };
}
export async function getScorecard(origin = ""): Promise<
  UiData<{
    as_of: string;
    rows: ScorecardRow[];
  }>
> {
  if (usesSample)
    return {
      ...((await import("@/data/sample/scorecard.json")).default as {
        as_of: string;
        rows: ScorecardRow[];
      }),
      dataSource: "sample",
    };
  return readApi(`${origin}/api/scorecard`);
}
export async function getIssues(
  origin = "",
): Promise<UiData<{ issues: Issue[] }>> {
  if (usesSample)
    return {
      ...((await import("@/data/sample/issues.json")).default as {
        issues: Issue[];
      }),
      dataSource: "sample",
    };
  return readApi(`${origin}/api/issues`);
}
export async function getBrief(amId: string): Promise<UiData<AmBrief>> {
  if (usesSample) {
    const brief = (await import("@/data/sample/am-brief.json"))
      .default as AmBrief;
    if (brief.area_manager_id !== amId)
      throw new Error("No sample brief is available for this manager.");
    return { ...brief, dataSource: "sample" };
  }
  return readApi(`/api/brief?am=${encodeURIComponent(amId)}`);
}
export async function getCard(
  cardId: string,
  issueId?: string,
  audience: ActionCard["audience"] = "salesperson",
): Promise<UiData<ActionCard> | null> {
  let lookupId: string;
  try { lookupId = decodeURIComponent(cardId); } catch { return null; }
  if (usesSample) {
    const { cards } = (await import("@/data/sample/cards.json")).default as {
      cards: ActionCard[];
    };
    const card =
      cards.find((card) =>
        issueId ? card.issue_id === issueId : card.id === lookupId,
      ) ?? null;
    return card ? { ...card, dataSource: "sample" } : null;
  }
  const response = !issueId
    ? await fetch(`/api/card?id=${encodeURIComponent(lookupId)}`, { cache: "no-store", signal: AbortSignal.timeout(10000) })
    : await fetch("/api/card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issue_id: issueId, audience }),
      signal: AbortSignal.timeout(10000),
    });
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error("The action card is unavailable. Please try again.");
  const card = (await response.json()) as UiData<ActionCard>;
  return {
    ...card,
    dataSource: card.dataSource === "sample" || card.dataSource === "db" ? card.dataSource : undefined,
  };
}
export async function getFlags(): Promise<
  UiData<{ flags: DataQualityFlag[] }>
> {
  if (usesSample)
    return {
      ...((await import("@/data/sample/dq-flags.json")).default as {
        flags: DataQualityFlag[];
      }),
      dataSource: "sample",
    };
  return readApi("/api/dq-flags");
}
export async function getRuns(): Promise<UiData<{ runs: RunLog[] }>> {
  if (usesSample)
    return {
      ...((await import("@/data/sample/run-log.json")).default as {
        runs: RunLog[];
      }),
      dataSource: "sample",
    };
  return readApi("/api/run-log");
}
