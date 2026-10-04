import Link from "next/link";
import { site } from "@/lib/site";
import { Crown } from "./crown";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <Crown className="h-7 w-7 text-gold transition-transform group-hover:-rotate-6" />
          <span className="font-display text-lg font-semibold uppercase tracking-wide">
            {site.shortName}
          </span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex gap-5 text-sm font-medium text-muted">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
