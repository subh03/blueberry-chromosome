import { Suspense } from "react";
import { PhoneCard } from "@/components/phone-card";

type Props = {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{ issue?: string; audience?: string }>;
};
async function CardRoute({ params, searchParams }: Props) {
  const [{ cardId }, { issue, audience }] = await Promise.all([
    params,
    searchParams,
  ]);
  const cardAudience = audience === "am" ? "am" : "salesperson";
  return (
    <PhoneCard
      key={`${cardId}:${issue ?? ""}:${cardAudience}`}
      cardId={cardId}
      issueId={issue}
      audience={cardAudience}
    />
  );
}
export default function Page(props: Props) {
  return (
    <Suspense fallback={<p role="status">Loading action card…</p>}>
      <CardRoute {...props} />
    </Suspense>
  );
}
