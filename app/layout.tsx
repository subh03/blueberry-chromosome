import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Store Coach | Manyavar",
  description: "Store problems and their evidence.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body>
    </html>
  );
}
