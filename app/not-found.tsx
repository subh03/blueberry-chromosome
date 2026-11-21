import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="shell page not-found" id="main-content">
      <LogoMark size={56} />
      <h1>This page doesn&rsquo;t exist</h1>
      <p>The link may be old or mistyped. The store problems and this week&rsquo;s briefs are still here.</p>
      <div className="hero-actions">
        <Link className="btn btn-primary" href="/">
          Go to the overview
        </Link>
        <Link className="btn btn-secondary" href="/am/AM-01">
          Open this week&rsquo;s brief
        </Link>
      </div>
    </main>
  );
}
