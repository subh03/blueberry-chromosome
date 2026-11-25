import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { AmBrief } from "@/types";
import briefsJson from "@/data/generated/am-briefs.json";
import { ManagerBrief } from "@/components/manager-brief";
import { AmSwitcher } from "@/components/am-switcher";
import { StoreTable } from "@/components/store-table";
import { LangSwitch } from "@/components/lang-switch";
import { dict, langOf } from "@/lib/ui/i18n";
import { storesOf } from "@/lib/ui/roles";
import { ActionItem } from "@/components/action-item";

// Server-rendered from the committed output of `npm run load` (same run as the API), so the brief
// paints complete: no skeleton swap, no layout shift.
const BRIEFS = (briefsJson as unknown as { briefs: AmBrief[] }).briefs;

export function generateStaticParams() {
  return BRIEFS.map((brief) => ({ amId: brief.area_manager_id }));
}

type Props = { params: Promise<{ amId: string }>; searchParams: Promise<{ lang?: string }> };

async function BriefRoute({ params, searchParams }: Props) {
  const [{ amId }, { lang: rawLang }] = await Promise.all([params, searchParams]);
  const brief = BRIEFS.find((item) => item.area_manager_id === amId);
  if (!brief) notFound();
  const lang = langOf(rawLang);
  const d = dict(lang);
  return (
    <>
      <div className="shell lang-row">
        <LangSwitch path={`/am/${amId}`} lang={lang} />
      </div>
      {lang !== "en" && (
        <section className="shell section-tight role-page" aria-labelledby="week-lang" lang={lang}>
          <h2 id="week-lang">
            {d.roleAm}: {brief.name} · {d.todayActions}
          </h2>
          <ol className="action-list">
            {brief.issues.map((issue, i) => (
              <ActionItem key={issue.id} issue={issue} lang={lang} index={i} />
            ))}
          </ol>
        </section>
      )}
      <ManagerBrief
        key={amId}
        amId={amId}
        initialBrief={brief}
        switcher={<AmSwitcher current={amId} />}
      />
      {/* v2: stores only, no salesperson rows. People live one tap deeper, on the store page. */}
      <section className="shell section-tight role-page" aria-labelledby="your-stores" lang={lang}>
        <h2 id="your-stores">{d.yourStores}</h2>
        <p className="muted small">{d.yourStoresNote}</p>
        <StoreTable stores={storesOf(amId)} lang={lang} />
      </section>
    </>
  );
}

export default function Page({ params, searchParams }: Props) {
  return (
    <Suspense
      fallback={
        <main className="shell page" role="status" aria-label="Loading the weekly brief">
          <div className="skeleton" style={{ height: 160 }} />
        </main>
      }
    >
      <BriefRoute params={params} searchParams={searchParams} />
    </Suspense>
  );
}
