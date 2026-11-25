import type { Lang, Standing as S } from "@/types";
import { standingWord } from "@/lib/ui/i18n";

/** A number with its standing as a word and an arrow, never colour alone. */
export function Standing({ value, standing, lang }: { value: string; standing: S; lang: Lang }) {
  const mark = standing === "above" ? "▲" : standing === "below" ? "▼" : standing === "same" ? "=" : "";
  return (
    <span className={`standing standing-${standing ?? "none"}`}>
      <span className="standing-value">{value}</span>
      <span className="standing-word">
        <span aria-hidden="true">{mark} </span>
        {standingWord(lang, standing)}
      </span>
    </span>
  );
}

export const fmtPct = (n: number | null) => (n === null ? "–" : `${n.toFixed(1)}%`);
export const fmtNum = (n: number | null) => (n === null ? "–" : n.toFixed(2));
