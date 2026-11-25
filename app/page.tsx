import Link from "next/link";
import { Suspense } from "react";
import { RolePicker } from "@/components/role-picker";
import { LangSwitch } from "@/components/lang-switch";
import { dict, langOf, withLang } from "@/lib/ui/i18n";
import { MANAGERS, TEAM } from "@/lib/ui/roles";

const managers = MANAGERS.map((m) => ({ value: m.id, label: `${m.name} · ${m.city}` }));
const stores = [...TEAM.stores]
  .sort((a, b) => a.city.localeCompare(b.city) || a.store_id.localeCompare(b.store_id))
  .map((s) => ({ value: s.store_id, label: `${s.store_id} · ${s.city}` }));
const people = TEAM.team
  .filter((p) => p.on_roster)
  .sort((a, b) => a.store_id.localeCompare(b.store_id) || a.display_name.localeCompare(b.display_name))
  .map((p) => ({ value: p.salesperson_id, label: `${p.display_name} · ${p.store_id}` }));

async function HomeInner({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = langOf((await searchParams).lang);
  const d = dict(lang);
  return (
    <main id="main-content" tabIndex={-1} className="shell page role-home" lang={lang}>
      <div className="page-head">
        <LangSwitch path="/" lang={lang} />
        <h1>{d.whoAreYou}</h1>
        <p className="role-line">{d.homeLine}</p>
      </div>
      <RolePicker lang={lang} managers={managers} stores={stores} people={people} />
      <p className="muted small role-foot">
        {d.remembered} · {d.synthetic}
      </p>
      <p>
        <Link className="btn btn-ghost" href={withLang("/overview", "en")}>
          {d.seeProof}
        </Link>
      </p>
    </main>
  );
}

const Fallback = () => (
  <main className="shell page" role="status" aria-label="Loading">
    <div className="skeleton" style={{ height: 160 }} />
  </main>
);

export default function Home(props: { searchParams: Promise<{ lang?: string }> }) {
  return (
    <Suspense fallback={<Fallback />}>
      <HomeInner {...props} />
    </Suspense>
  );
}
