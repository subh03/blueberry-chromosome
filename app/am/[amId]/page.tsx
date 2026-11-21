import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { AmBrief } from "@/types";
import briefsJson from "@/data/generated/am-briefs.json";
import { ManagerBrief } from "@/components/manager-brief";
import { AmSwitcher } from "@/components/am-switcher";

// Server-rendered from the committed output of `npm run load` (same run as the API), so the brief
// paints complete: no skeleton swap, no layout shift.
const BRIEFS = (briefsJson as unknown as { briefs: AmBrief[] }).briefs;

export function generateStaticParams() {
  return BRIEFS.map((brief) => ({ amId: brief.area_manager_id }));
}

async function BriefRoute({ params }: { params: Promise<{ amId: string }> }) {
  const { amId } = await params;
  const brief = BRIEFS.find((item) => item.area_manager_id === amId);
  if (!brief) notFound();
  return (
    <ManagerBrief
      key={amId}
      amId={amId}
      initialBrief={brief}
      switcher={<AmSwitcher current={amId} />}
    />
  );
}

export default function Page({ params }: { params: Promise<{ amId: string }> }) {
  return (
    <Suspense
      fallback={
        <main className="shell page" role="status" aria-label="Loading the weekly brief">
          <div className="skeleton" style={{ height: 160 }} />
        </main>
      }
    >
      <BriefRoute params={params} />
    </Suspense>
  );
}
