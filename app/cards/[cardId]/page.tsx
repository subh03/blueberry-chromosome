import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Issue } from "@/types";
import issuesJson from "@/data/generated/issues.json";
import { PhoneCard } from "@/components/phone-card";

type Props = {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{ issue?: string; audience?: string }>;
};

const ISSUES = (issuesJson as unknown as { issues: Issue[] }).issues;
// Salesperson names as the evidence gives them (first name + initial), keyed by issue id.
const NAMES: Record<string, string> = Object.fromEntries(
  ISSUES.filter((issue) => issue.evidence.subject).map((issue) => [
    issue.id,
    issue.evidence.subject!.display_name,
  ]),
);

async function CardRoute({ params, searchParams }: Props) {
  const [{ cardId }, { issue, audience }] = await Promise.all([params, searchParams]);
  let id: string;
  try {
    id = decodeURIComponent(cardId);
  } catch {
    notFound();
  }
  if (!id.trim()) notFound();
  if (id === "for-issue" && (!issue || !ISSUES.some((item) => item.id === issue))) notFound();
  const cardAudience = audience === "am" ? "am" : "salesperson";
  return (
    <PhoneCard
      key={`${cardId}:${issue ?? ""}:${cardAudience}`}
      cardId={cardId}
      issueId={issue}
      audience={cardAudience}
      names={NAMES}
    />
  );
}
export default function Page(props: Props) {
  return (
    <Suspense
      fallback={
        <main className="shell page" role="status" aria-label="Loading the action card">
          <div className="skeleton" style={{ height: 560, maxWidth: 380 }} />
        </main>
      }
    >
      <CardRoute {...props} />
    </Suspense>
  );
}
