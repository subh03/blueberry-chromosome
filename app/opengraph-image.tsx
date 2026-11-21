import { ImageResponse } from "next/og";

export const alt =
  "Store Coach for Manyavar: finds what is going wrong in your stores and tells each person what to do today";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Logo + headline only. No data on the share image.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#083F39",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="88" height="88" viewBox="0 0 32 32">
            <rect x="2.9" y="6.9" width="21.2" height="21.2" rx="5" fill="none" stroke="#ffffff" strokeWidth="1.8" />
            <path d="M8 18.2 12.6 22.8 27.5 4.5" fill="none" stroke="#F3B23A" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 700 }}>Store Coach</div>
            <div style={{ fontSize: 30, color: "#CFE3DE" }}>for Manyavar</div>
          </div>
        </div>
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>
          Finds what&rsquo;s going wrong in your stores and tells each person what to do today.
        </div>
        <div style={{ display: "flex", width: 160, height: 10, borderRadius: 5, background: "#F3B23A" }} />
      </div>
    ),
    size,
  );
}
