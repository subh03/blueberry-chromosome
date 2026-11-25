import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LangSwitch } from "@/components/lang-switch";
import { ActionItem } from "@/components/action-item";
import { Standing, fmtNum, fmtPct } from "@/components/standing";
import { dict, langOf, withLang } from "@/lib/ui/i18n";
import { TEAM, median, personById, personIssues, teamOf } from "@/lib/ui/roles";

type Props = { params: Promise<{ spId: string }>; searchParams: Promise<{ lang?: string }> };

export function generateStaticParams() {
  return TEAM.team.map((p) => ({ spId: p.salesperson_id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = personById((await params).spId);
  return { title: p ? `${p.display_name}, ${p.store_id}` : "Salesperson" };
}

async function MePage({ params, searchParams }: Props) {
  const [{ spId }, { lang: rawLang }] = await Promise.all([params, searchParams]);
  const me = personById(spId);
  if (!me) notFound();
  const lang = langOf(rawLang);
  const d = dict(lang);
  const issues = personIssues(spId).slice(0, 1); // one thing a day
  const others = teamOf(me.store_id).filter((p) => p.salesperson_id !== spId && p.on_roster);
  const mid = {
    presence: median(others.map((p) => p.presence)),
    est_conversion: median(others.map((p) => p.est_conversion)),
    ipb: median(others.map((p) => p.ipb)),
    repeat_rate: median(others.map((p) => p.repeat_rate)),
  };
  const rows = [
    { label: d.presence, mine: fmtPct(me.presence), middle: fmtPct(mid.presence), s: me.vs_store.presence },
    { label: d.estConversion, mine: fmtPct(me.est_conversion), middle: fmtPct(mid.est_conversion), s: me.vs_store.est_conversion },
    { label: d.basket, mine: fmtNum(me.ipb), middle: fmtNum(mid.ipb), s: me.vs_store.ipb },
    { label: d.repeat, mine: fmtPct(me.repeat_rate), middle: fmtPct(mid.repeat_rate), s: me.vs_store.repeat_rate },
  ];

  return (
    <main id="main-content" tabIndex={-1} className="shell page role-page role-narrow" lang={lang}>
      <div className="page-head">
        <LangSwitch path={`/me/${spId}`} lang={lang} />
        <p className="muted small">
          {d.roleSp} ·{" "}
          <Link href={withLang(`/store/${me.store_id}`, lang)}>
            {d.storeTitle} {me.store_id}
          </Link>
        </p>
        <h1>
          {d.hello}, {me.display_name}
        </h1>
      </div>

      <section className="section-tight" aria-labelledby="one-title">
        <h2 id="one-title">{d.oneThing}</h2>
        {issues.length ? (
          <ol className="action-list">
            {issues.map((issue) => (
              <ActionItem key={issue.id} issue={issue} lang={lang} />
            ))}
          </ol>
        ) : (
          <p className="state">{d.noCard}</p>
        )}
      </section>

      <section className="section-tight" aria-labelledby="week-title">
        <h2 id="week-title">{d.myWeek}</h2>
        {me.on_roster ? (
          <dl className="my-week">
            {rows.map((r) => (
              <div key={r.label} className="my-week-row">
                <dt>{r.label}</dt>
                <dd>
                  <Standing value={r.mine} standing={r.s} lang={lang} />
                  <span className="muted small">
                    {d.storeMiddle}: {r.middle}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="state">{d.notOnRoster}</p>
        )}
        <p className="muted small">{d.teamNote}</p>
      </section>
    </main>
  );
}

const Fallback = () => (
  <main className="shell page" role="status" aria-label="Loading">
    <div className="skeleton" style={{ height: 160 }} />
  </main>
);

export default function Page(props: Props) {
  return (
    <Suspense fallback={<Fallback />}>
      <MePage {...props} />
    </Suspense>
  );
}
