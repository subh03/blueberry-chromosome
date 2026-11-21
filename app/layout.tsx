import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import { Suspense } from "react";
import { SiteHeader, SiteHeaderLive } from "@/components/site-header";
import { Logo } from "@/components/brand/logo";
import { Toaster } from "@/components/toast";
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

const DESCRIPTION =
  "Store Coach for Manyavar: finds what is going wrong in your stores and tells each person what to do today";
export const metadata: Metadata = {
  metadataBase: new URL("https://blueberry-chromosome.vercel.app"),
  title: { default: "Store Coach for Manyavar", template: "%s | Store Coach" },
  description: DESCRIPTION,
  openGraph: {
    title: "Store Coach for Manyavar",
    description: DESCRIPTION,
    siteName: "Store Coach",
    type: "website",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: "Store Coach for Manyavar", description: DESCRIPTION },
};
export const viewport: Viewport = { themeColor: "#ffffff" };


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
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Suspense fallback={<SiteHeader />}>
          <SiteHeaderLive />
        </Suspense>
        {children}
        <Toaster />
        <footer className="site-footer">
          <div className="shell site-footer-row">
            <Logo size="sm" />
            <p>
              A hackathon build for Manyavar&rsquo;s Store Coach problem statement.
              Synthetic data supplied by the organisers.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
