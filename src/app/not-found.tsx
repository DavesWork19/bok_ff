import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="font-display text-7xl font-bold text-gold">404</p>
      <h1 className="mt-4 font-display text-3xl font-semibold uppercase tracking-wide">
        Fumbled. This page doesn&apos;t exist.
      </h1>
      <p className="mt-3 text-muted">Maybe it got dropped to waivers.</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold/90"
      >
        Back to the homepage
      </Link>
    </div>
  );
}
