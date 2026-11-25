"use client";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight, Compass, Store, UserRound } from "lucide-react";
import type { Lang } from "@/types";
import { dict, withLang } from "@/lib/ui/i18n";

type Option = { value: string; label: string };
type Role = "am" | "store" | "sp";
const KEY = "store-coach:role";

/** Home: "Who are you?" Three roles, each with its own list. The phone remembers the last choice. */
export function RolePicker({
  lang,
  managers,
  stores,
  people,
}: {
  lang: Lang;
  managers: Option[];
  stores: Option[];
  people: Option[];
}) {
  const d = dict(lang);
  const router = useRouter();
  // The remembered choice is read from this phone's storage after hydration (server sees none).
  const savedRaw = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const saved = (() => {
    try {
      return JSON.parse(savedRaw ?? "null") as { role: Role; value: string } | null;
    } catch {
      return null;
    }
  })();
  const defaults: Record<Role, string> = {
    am: managers[0]?.value ?? "",
    store: stores[0]?.value ?? "",
    sp: people[0]?.value ?? "",
  };
  const [chosen, setChosen] = useState<Partial<Record<Role, string>>>({});
  const valueOf = (role: Role) => chosen[role] ?? (saved?.role === role ? saved.value : defaults[role]);
  const last = saved?.role ?? null;

  const go = (role: Role) => {
    const value = valueOf(role);
    if (!value) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ role, value }));
    } catch {
      /* ignore */
    }
    const path = role === "am" ? `/am/${value}` : role === "store" ? `/store/${value}` : `/me/${value}`;
    router.push(withLang(path, lang));
  };

  const roles: { role: Role; title: string; hint: string; label: string; options: Option[]; Icon: typeof Compass }[] = [
    { role: "am", title: d.roleAm, hint: d.roleAmHint, label: d.chooseAm, options: managers, Icon: Compass },
    { role: "store", title: d.roleStore, hint: d.roleStoreHint, label: d.chooseStore, options: stores, Icon: Store },
    { role: "sp", title: d.roleSp, hint: d.roleSpHint, label: d.chooseSp, options: people, Icon: UserRound },
  ];

  return (
    <ul className="role-list">
      {roles.map(({ role, title, hint, label, options, Icon }) => (
        <li key={role} className="role-card" data-last={last === role || undefined}>
          <div className="role-head">
            <span className="step-icon" aria-hidden="true">
              <Icon size={20} />
            </span>
            <div>
              <h2 className="role-title">{title}</h2>
              <p className="muted">{hint}</p>
            </div>
          </div>
          <form
            className="role-form"
            onSubmit={(event) => {
              event.preventDefault();
              go(role);
            }}
          >
            <label className="sr-only" htmlFor={`pick-${role}`}>
              {label}
            </label>
            <select
              id={`pick-${role}`}
              className="role-select"
              value={valueOf(role)}
              onChange={(event) => setChosen((c) => ({ ...c, [role]: event.target.value }))}
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary">
              {d.open} <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
