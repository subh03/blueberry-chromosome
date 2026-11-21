"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/am/AM-01", label: "Weekly brief" },
  { href: "/#how-we-checked", label: "How we checked" },
];

/** Header that marks the current page. Render inside <Suspense> (it reads the URL). */
export function SiteHeaderLive() {
  return <SiteHeader pathname={usePathname()} />;
}

export function SiteHeader({ pathname = "" }: { pathname?: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const current = (href: string) =>
    href === "/" ? pathname === "/" : href.startsWith("/am/") ? pathname.startsWith("/am/") : false;

  return (
    <header className="site-header" data-scrolled={scrolled || undefined}>
      <div className="shell site-header-row">
        <Link href="/" className="wordmark">
          <Logo />
        </Link>
        <nav aria-label="Main" className="nav-desktop">
          <ul className="nav-list">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} aria-current={current(link.href) ? "page" : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="menu-button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <nav
        id="mobile-menu"
        aria-label="Menu"
        className="nav-mobile"
        hidden={!open}
      >
        <ul className="shell">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current(link.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
