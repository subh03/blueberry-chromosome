import { Suspense } from "react";
import { ManagerBrief } from "@/components/manager-brief";

async function BriefRoute({ params }: { params: Promise<{ amId: string }> }) {
  const { amId } = await params;
  return <ManagerBrief key={amId} amId={amId} />;
}

export default function Page({
  params,
}: {
  params: Promise<{ amId: string }>;
}) {
  return (
    <Suspense fallback={<main className="shell page" role="status" aria-label="Loading the weekly brief"><div className="skeleton" style={{ height: 160 }} /></main>}>
      <BriefRoute params={params} />
    </Suspense>
  );
}
