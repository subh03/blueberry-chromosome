import { Suspense } from "react";
import { ManagerBrief } from "@/components/manager-brief";

async function BriefRoute({ params }: { params: Promise<{ amId: string }> }) {
  const { amId } = await params;
  return <ManagerBrief amId={amId} />;
}

export default function Page({ params }: { params: Promise<{ amId: string }> }) {
  return <Suspense fallback={<p role="status">Loading weekly brief…</p>}><BriefRoute params={params} /></Suspense>;
}
