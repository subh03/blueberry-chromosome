import type { Followup } from "@/types";
import { ArrowDown } from "lucide-react";

export function FollowupBadge({ followup }: { followup: Followup | null }) {
  if (!followup)
    return <p className="followup">Moved? No follow-up snapshot yet.</p>;
  return (
    <p className="followup">
      <strong>
        {followup.direction === "down" && (
          <ArrowDown className="delta-down" size={16} aria-hidden="true" />
        )}
        Moved?{" "}
        {followup.direction === "up"
          ? "Up"
          : followup.direction === "down"
            ? "Down"
            : "Unchanged"}
      </strong>{" "}
      · {followup.metric} · {followup.display}
      <small>
        {followup.before_as_of} to {followup.after_as_of}
      </small>
    </p>
  );
}
