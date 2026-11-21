/**
 * Store Coach mark: a rounded square (a clipboard) holding one check whose right arm rises past the edge.
 * Flat fills only. Our own mark; it borrows nothing from Manyavar's brand.
 */
export function LogoMark({
  tone = "light",
  size = 32,
  className,
}: {
  tone?: "light" | "dark";
  size?: number;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x={dark ? 2.9 : 2}
        y={dark ? 6.9 : 6}
        width={dark ? 21.2 : 23}
        height={dark ? 21.2 : 23}
        rx={5}
        fill={dark ? "none" : "#083F39"}
        stroke={dark ? "#ffffff" : "none"}
        strokeWidth={dark ? 1.8 : 0}
      />
      <path
        d="M8 18.2 12.6 22.8 27.5 4.5"
        fill="none"
        stroke="#F3B23A"
        strokeWidth={3.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  tone = "light",
  size = "md",
  sub = true,
}: {
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  sub?: boolean;
}) {
  const mark = size === "lg" ? 44 : size === "sm" ? 26 : 32;
  return (
    <span className={`logo logo-${tone} logo-${size}`}>
      <LogoMark tone={tone} size={mark} />
      <span className="logo-words">
        <span className="logo-name">Store Coach</span>
        {sub && <span className="logo-sub">for Manyavar</span>}
      </span>
    </span>
  );
}
