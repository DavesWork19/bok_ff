import Link from "next/link";
import { formatDate, type Post } from "@/lib/content";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/rankings/${post.slug}`}
      className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-gold/60 hover:bg-surface-2"
    >
      <time dateTime={post.date} className="text-xs font-medium uppercase tracking-wider text-muted">
        {formatDate(post.date, "short")}
      </time>
      <h3 className="mt-2 font-display text-xl font-semibold uppercase leading-tight tracking-wide group-hover:text-gold">
        {post.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
    </Link>
  );
}
