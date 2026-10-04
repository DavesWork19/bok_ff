import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { formatDate, getAllPosts, getPost } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/rankings/[slug]">): Promise<Metadata> {
  const post = getPost((await props.params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/rankings/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: post.date },
  };
}

export default async function PostPage(props: PageProps<"/rankings/[slug]">) {
  const { slug } = await props.params;
  const posts = getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) notFound();

  const post = posts[index];
  const newer = posts[index - 1];
  const older = posts[index + 1];

  return (
    <article className="mx-auto max-w-3xl px-4 pt-12">
      <Link href="/rankings" className="text-sm font-medium text-muted hover:text-gold">
        ← All rankings
      </Link>
      <header className="mt-6 border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          {post.season} Season
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-tight tracking-wide sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-muted">
          <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min read
        </p>
      </header>

      <div className="post-body prose prose-lg mt-8 max-w-none">
        <Markdown source={post.body} />
      </div>

      <nav aria-label="More rankings" className="mt-16 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
        {older ? (
          <Link href={`/rankings/${older.slug}`} className="group rounded-xl border border-line p-4 hover:border-gold/60">
            <span className="text-xs uppercase tracking-wider text-muted">← Previous</span>
            <span className="mt-1 block font-display font-semibold uppercase group-hover:text-gold">{older.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {newer && (
          <Link
            href={`/rankings/${newer.slug}`}
            className="group rounded-xl border border-line p-4 text-right hover:border-gold/60"
          >
            <span className="text-xs uppercase tracking-wider text-muted">Next →</span>
            <span className="mt-1 block font-display font-semibold uppercase group-hover:text-gold">{newer.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
