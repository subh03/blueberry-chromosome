import type { Issue } from "@/types";

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * One week later. Coloured by `improved` (a discount going down is good), never by direction alone.
 * It reports movement only: it never says the advice caused it.
 */
export function FollowupBadge({
  issue,
  compact = false,
}: {
  issue: Pick<Issue, "followup" | "followup_note" | "evidence">;
  compact?: boolean;
}) {
  const followup = issue.followup;
  if (!followup) {
    const note = issue.followup_note ?? issue.evidence.followup_note;
    return (
      <span className={`followup followup-new${compact ? " followup-compact" : ""}`}>
        <span className="followup-label">Moved?</span>
        <span className="followup-text">
          New this week
          {!compact && note ? `. ${sentence(note.replace(/^New this week:?\s*/i, ""))}` : ""}
        </span>
      </span>
    );
  }
  const tone =
    followup.improved === true ? "better" : followup.direction === "flat" || followup.improved === undefined ? "flat" : "worse";
  return (
    <span className={`followup followup-${tone}${compact ? " followup-compact" : ""}`}>
      <span className="followup-label">Moved?</span>
      <span className="followup-text">A week later: {followup.display}</span>
    </span>
  );
}
