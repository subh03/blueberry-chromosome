import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Store Coach | Manyavar",
  description:
    "Finds what's going wrong in your stores and tells each person what to do today.",
};
export const viewport: Viewport = { themeColor: "#083F39" };

// Arms the hero count-up before first paint, only when it will really play
// (motion allowed, not yet played this session). Without JS nothing is hidden.
const countupScript = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&sessionStorage.getItem('sc-countup')!=='played'){document.documentElement.dataset.countup='armed'}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-IN"
      className={`${display.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: countupScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <div className="shell">
            Synthetic data supplied by the organisers. Every number is computed
            in code; the AI only writes the words.
          </div>
        </footer>
      </body>
    </html>
  );
}
