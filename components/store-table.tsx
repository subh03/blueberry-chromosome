import Link from "next/link";
import type { Lang, StoreCompare } from "@/types";
import { dict, withLang } from "@/lib/ui/i18n";
import { inr } from "@/lib/ui/home";
import { Standing, fmtNum, fmtPct } from "@/components/standing";

/** Stores only, no people: what an area manager needs to choose where to look. */
export function StoreTable({ stores, lang, link = true }: { stores: StoreCompare[]; lang: Lang; link?: boolean }) {
  const d = dict(lang);
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{d.storeTitle}</th>
            <th scope="col">{d.conversion}</th>
            <th scope="col">{d.basket}</th>
            <th scope="col">{d.presence}</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((s) => (
            <tr key={s.store_id}>
              <th scope="row">
                {link ? (
                  <Link href={withLang(`/store/${s.store_id}`, lang)}>{s.store_id}</Link>
                ) : (
                  s.store_id
                )}
                {s.basket_flag && (
                  <span className="table-flag">
                    {d.basketWatch} · {inr(s.basket_flag.rupees)}
                  </span>
                )}
              </th>
              {s.is_new ? (
                <td colSpan={3} className="muted">
                  {d.tooNew}
                </td>
              ) : (
                <>
                  <td>
                    <Standing value={fmtPct(s.conversion.now)} standing={s.conversion.vs_peers} lang={lang} />
                  </td>
                  <td>
                    <Standing value={fmtNum(s.ipb.now)} standing={s.ipb.vs_peers} lang={lang} />
                  </td>
                  <td>
                    <Standing value={fmtPct(s.presence.now)} standing={s.presence.vs_peers} lang={lang} />
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
