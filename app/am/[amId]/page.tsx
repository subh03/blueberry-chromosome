import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AmSwitcher } from "@/components/am-switcher";
import { StoreTable } from "@/components/store-table";
import { LangSwitch } from "@/components/lang-switch";
import { ProblemRow } from "@/components/problem-row";
import { ShareButtons } from "@/components/share-buttons";
import { dict, langOf, withLang } from "@/lib/ui/i18n";
import { inr } from "@/lib/ui/home";
import { BRIEFS, ISSUES, issueWords, storesOf } from "@/lib/ui/roles";
import type { Lang } from "@/types";

// Server-rendered from the committed output of `npm run load` (same run as the API).
type Props = { params: Promise<{ amId: string }>; searchParams: Promise<{ lang?: string }> };

export function generateStaticParams() {
  return BRIEFS.map((brief) => ({ amId: brief.area_manager_id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { amId } = await params;
  const brief = BRIEFS.find((b) => b.area_manager_id === amId);
  return { title: brief ? `Weekly brief, ${brief.city}` : "Weekly brief" };
}

const asOfDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));

/** Area manager: the problems in their stores (≤5, biggest ₹ first), a message to forward, and their stores vs peers. No people. */
async function BriefRoute({ params, searchParams }: Props) {
  const [{ amId }, { lang: rawLang }] = await Promise.all([params, searchParams]);
  const brief = BRIEFS.find((item) => item.area_manager_id === amId);
  if (!brief) notFound();
  const lang: Lang = langOf(rawLang);
  const d = dict(lang);
  const issues = [...brief.issues].sort((a, b) => b.rupees_at_stake - a.rupees_at_stake).slice(0, brief.max_alerts_per_week);
  const market = ISSUES.find((i) => i.area_manager_id === amId && i.type === "city_slowdown") ?? null;
  const from = `/am/${amId}`;
  const message = [
    `${d.morningHello} ${brief.name.split(" ")[0]}. ${brief.city}: ${d.morningIntro}`,
    ...issues.map((issue, i) => {
      const w = issueWords(issue, lang);
      return `${i + 1}. ${issue.store_id} · ${inr(issue.rupees_at_stake)} · ${w.cause.text} → ${w.action.text}`;
    }),
    ...(market ? [`${d.marketNote}: ${issueWords(market, lang).cause.text}`] : []),
    `Store Coach · ${d.synthetic}`,
  ].join("\n");

  return (
    <main id="main-content" tabIndex={-1} className="shell page role-page" lang={lang}>
      <div className="page-head">
        <LangSwitch path={from} lang={lang} />
        <p className="muted small">{d.roleAm}</p>
        <h1>
          {d.weekFor} {brief.name}
        </h1>
        <p className="muted">
          {brief.city} · {d.dataAsOf} {asOfDate(brief.as_of)} · {d.maxFive} {d.synthetic}
        </p>
      </div>
      <AmSwitcher current={amId} lang={lang} />

      {market && (
        <aside className="market-note" aria-label={d.marketNote}>
          <p className="market-label">{d.marketNote}</p>
          <p lang={issueWords(market, lang).cause.lang}>{issueWords(market, lang).cause.text}</p>
          <p className="muted">{d.marketNoteWhy}</p>
        </aside>
      )}

      <section className="section-tight" aria-labelledby="problems-title">
        <h2 id="problems-title">{d.problems}</h2>
        {issues.length ? (
          <ol className="problem-rows">
            {issues.map((issue, i) => (
              <ProblemRow key={issue.id} issue={issue} lang={lang} from={from} index={i} />
            ))}
          </ol>
        ) : (
          <p className="state">{d.noProblems}</p>
        )}
      </section>

      <section className="section-tight morning" aria-labelledby="morning-title">
        <h2 id="morning-title">{d.morning}</h2>
        <pre className="morning-text">{message}</pre>
        <ShareButtons text={message} copyLabel={d.copy} shareLabel={d.share} copied={d.copied} />
        <p className="muted small">{d.shareNote}</p>
      </section>

      <section className="section-tight" aria-labelledby="your-stores">
        <h2 id="your-stores">{d.yourStores}</h2>
        <p className="muted small">{d.yourStoresNote}</p>
        <StoreTable stores={storesOf(amId)} lang={lang} />
      </section>

      <p>
        <a className="btn btn-ghost" href={withLang("/overview", "en")}>
          {d.seeProof}
        </a>
      </p>
    </main>
  );
}

export default function Page(props: Props) {
  return (
    <Suspense
      fallback={
        <main className="shell page" role="status" aria-label="Loading the weekly brief">
          <div className="skeleton" style={{ height: 160 }} />
        </main>
      }
    >
      <BriefRoute {...props} />
    </Suspense>
  );
}
