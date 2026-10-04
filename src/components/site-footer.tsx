import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <blockquote className="max-w-2xl">
          <p className="font-display text-xl leading-snug text-fg sm:text-2xl">
            “{site.quote.text}”
          </p>
          <footer className="mt-3 text-sm text-muted">— {site.quote.attribution}</footer>
        </blockquote>
        <p className="mt-10 text-xs text-muted">
          © {new Date().getFullYear()} {site.name} · {site.tagline}
        </p>
      </div>
    </footer>
  );
}
