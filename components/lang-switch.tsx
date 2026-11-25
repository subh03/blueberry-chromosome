import Link from "next/link";
import type { Lang } from "@/types";
import { LANGS, dict } from "@/lib/ui/i18n";

/** Plain links (no JS needed): each keeps the page and swaps ?lang=. */
export function LangSwitch({ path, lang }: { path: string; lang: Lang }) {
  return (
    <nav className="lang-switch" aria-label={dict(lang).language}>
      {LANGS.map((l) => (
        <Link
          key={l.code}
          href={l.code === "en" ? path : `${path}?lang=${l.code}`}
          aria-current={l.code === lang ? "true" : undefined}
          lang={l.code}
          prefetch={false}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
