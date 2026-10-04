import type { Metadata } from "next";
import { PostCard } from "@/components/post-card";
import { getPostsBySeason } from "@/lib/content";

export const metadata: Metadata = {
  title: "Weekly Power Rankings",
  description: "Every Blackout Kings weekly power ranking, season by season.",
};

export default function RankingsArchive() {
  const seasons = getPostsBySeason();

  return (
    <div className="mx-auto max-w-5xl px-4 pt-12">
      <h1 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
        Power Rankings
      </h1>
      <p className="mt-3 text-muted">Every week&apos;s rankings, straight from the Commish.</p>

      {seasons.map(([season, posts]) => (
        <section key={season} className="mt-12" aria-labelledby={`season-${season}`}>
          <h2
            id={`season-${season}`}
            className="flex items-center gap-4 font-display text-2xl font-semibold uppercase tracking-wide text-gold"
          >
            {season} Season
            <span className="h-px flex-1 bg-line" />
            <span className="font-sans text-sm font-normal normal-case tracking-normal text-muted">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
