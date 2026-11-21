import { Suspense } from "react";
import { PhoneCard } from "@/components/phone-card";

type Props = {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{ issue?: string }>;
};
async function CardRoute({ params, searchParams }: Props) {
  const [{ cardId }, { issue }] = await Promise.all([params, searchParams]);
  return (
    <PhoneCard
      key={`${cardId}:${issue ?? ""}`}
      cardId={cardId}
      issueId={issue}
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
