import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header-row">
        <Link href="/" className="wordmark" aria-label="Store Coach, overview">
          <span className="wordmark-dot" aria-hidden="true" />
          Store Coach
        </Link>
        <nav aria-label="Main">
          <ul className="nav-list">
            <li>
              <Link href="/">Overview</Link>
            </li>
            <li>
              <Link href="/am/AM-01">Weekly brief</Link>
            </li>
            <li className="nav-checked">
              <Link href="/#how-we-checked">How we checked</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
