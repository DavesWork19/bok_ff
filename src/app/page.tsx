import Link from "next/link";
import { Crown } from "@/components/crown";
import { PostCard } from "@/components/post-card";
import { formatDate, getAllPosts } from "@/lib/content";
import { site } from "@/lib/site";

export default function Home() {
  const [latest, ...rest] = getAllPosts();
  const recent = rest.slice(0, 6);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-gold-soft),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <Crown className="h-12 w-12 text-gold" />
          <h1 className="mt-6 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl">
            Blackout Kings
            <span className="block text-gold">Fantasy Football</span>
          </h1>
          <p className="mt-5 text-lg text-muted">{site.tagline}</p>
        </div>
      </section>

      {latest && (
        <section className="mx-auto max-w-5xl px-4 pt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Latest</p>
          <Link
            href={`/rankings/${latest.slug}`}
            className="group mt-3 block rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-gold/60 sm:p-8"
          >
            <time dateTime={latest.date} className="text-sm text-muted">
              {formatDate(latest.date)} · {latest.readingMinutes} min read
            </time>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-tight tracking-wide group-hover:text-gold sm:text-4xl">
              {latest.title}
            </h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted">{latest.excerpt}</p>
            <span className="mt-5 inline-block text-sm font-semibold text-gold">
              Read the rankings →
            </span>
          </Link>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pt-14">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
              Recent Rankings
            </h2>
            <Link href="/rankings" className="text-sm font-medium text-muted hover:text-gold">
              Full archive →
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
