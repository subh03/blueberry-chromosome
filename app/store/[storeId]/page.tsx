import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LangSwitch } from "@/components/lang-switch";
import { StoreTable } from "@/components/store-table";
import { ProblemRow } from "@/components/problem-row";
import { Standing, fmtNum, fmtPct } from "@/components/standing";
import { dict, langOf, withLang } from "@/lib/ui/i18n";
import { inr } from "@/lib/ui/home";
import { MANAGERS, TEAM, roleModelIn, storeById, storeIssues, teamOf } from "@/lib/ui/roles";

type Props = { params: Promise<{ storeId: string }>; searchParams: Promise<{ lang?: string }> };

export function generateStaticParams() {
  return TEAM.stores.map((s) => ({ storeId: s.store_id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Store ${(await params).storeId}` };
}

async function StorePage({ params, searchParams }: Props) {
  const [{ storeId }, { lang: rawLang }] = await Promise.all([params, searchParams]);
  const store = storeById(storeId);
  if (!store) notFound();
  const lang = langOf(rawLang);
  const d = dict(lang);
  const issues = storeIssues(storeId).slice(0, 3);
  const team = teamOf(storeId);
  const model = roleModelIn(storeId);
  const am = MANAGERS.find((m) => m.id === store.area_manager_id);

  return (
    <main id="main-content" tabIndex={-1} className="shell page role-page" lang={lang}>
      <div className="page-head">
        <LangSwitch path={`/store/${storeId}`} lang={lang} />
        <p className="muted small">
          {d.roleStore} · {store.city}
          {am && (
            <>
              {" · "}
              <Link href={withLang(`/am/${am.id}`, lang)}>
                {d.areaManager}: {am.name}
              </Link>
            </>
          )}
        </p>
        <h1>
          {d.storeTitle} {storeId}
        </h1>
        <p className="muted small">
          {d.last28} 31 Oct 2026 · {d.synthetic}
        </p>
      </div>

      <section className="section-tight" aria-labelledby="today-title">
        <h2 id="today-title">{d.todayActions}</h2>
        {issues.length || store.basket_flag ? (
          <ol className="problem-rows">
            {issues.map((issue, i) => (
              <ProblemRow key={issue.id} issue={issue} lang={lang} from={`/store/${storeId}`} index={i} />
            ))}
            {store.basket_flag && (
              <li className="action-item">
                <div className="action-top">
                  <span className="lever-tag">{d.bigger_baskets}</span>
                  <span className="money-figure">
                    {inr(store.basket_flag.rupees)} <span className="muted small">{d.atStake}</span>
                  </span>
                </div>
                <p className="action-text">
                  <strong>{issues.length + 1}. </strong>
                  {d.basketAction}
                </p>
                <p className="muted small">
                  {d.basketWhy}: {fmtNum(store.ipb.now)} · {d.city} {fmtNum(store.ipb.city_peers)} · {d.state}{" "}
                  {fmtNum(store.ipb.state_peers)} · {d.before} {fmtNum(store.ipb.baseline)}. ₹ = {store.basket_flag.gap_vs_peers} ×{" "}
                  {store.bills} × {inr(store.basket_flag.avg_item_value)}
                </p>
              </li>
            )}
          </ol>
        ) : (
          <p className="state">{d.noActions}</p>
        )}
      </section>

      <section className="section-tight" aria-labelledby="team-title">
        <h2 id="team-title">{d.myTeam}</h2>
        <p className="muted small">{d.teamNote}</p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{d.roleSp}</th>
                <th scope="col">{d.presence}</th>
                <th scope="col">{d.estConversion}</th>
                <th scope="col">{d.basket}</th>
                <th scope="col">{d.repeat}</th>
              </tr>
            </thead>
            <tbody>
              {team.map((p) => (
                <tr key={p.salesperson_id} data-off={!p.on_roster || undefined}>
                  <th scope="row">
                    <Link href={withLang(`/me/${p.salesperson_id}`, lang)}>{p.display_name}</Link>
                    <span className="muted small table-sub">
                      {p.bills} {d.bills}
                    </span>
                  </th>
                  {p.on_roster ? (
                    <>
                      <td>
                        <Standing value={fmtPct(p.presence)} standing={p.vs_store.presence} lang={lang} />
                      </td>
                      <td>
                        <Standing value={fmtPct(p.est_conversion)} standing={p.vs_store.est_conversion} lang={lang} />
                      </td>
                      <td>
                        <Standing value={fmtNum(p.ipb)} standing={p.vs_store.ipb} lang={lang} />
                      </td>
                      <td>
                        <Standing value={fmtPct(p.repeat_rate)} standing={p.vs_store.repeat_rate} lang={lang} />
                      </td>
                    </>
                  ) : (
                    <td colSpan={4} className="muted">
                      {d.notOnRoster}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {model?.evidence.subject && (
          <p className="model-line">
            <span className="chip chip-model">{d.learnFrom}</span>{" "}
            <Link href={withLang(`/me/${model.evidence.subject.salesperson_id}`, lang)}>
              {model.evidence.subject.display_name}
            </Link>{" "}
            <span className="muted" lang="en">
              {model.cause}
            </span>
          </p>
        )}
      </section>

      <section className="section-tight" aria-labelledby="peers-title">
        <h2 id="peers-title">{d.storeVsPeers}</h2>
        <StoreTable stores={[store]} lang={lang} link={false} />
        {store.basket_flag && (
          <p className="muted small" lang="en">
            {d.basketCheck}: {store.basket_flag.display}. ₹ = {store.basket_flag.formula}.
          </p>
        )}
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
      <StorePage {...props} />
    </Suspense>
  );
}
