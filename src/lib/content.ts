import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type Post = {
  slug: string;
  title: string;
  date: string;
  season: number;
  excerpt: string;
  readingMinutes: number;
  body: string;
};

export type Page = {
  slug: string;
  title: string;
  body: string;
};

function readDir(dir: string) {
  const full = path.join(CONTENT_DIR, dir);
  return fs
    .readdirSync(full)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      slug: file.replace(/\.md$/, ""),
      ...matter(fs.readFileSync(path.join(full, file), "utf8")),
    }));
}

// First real paragraph of prose, with Markdown syntax stripped.
function excerptOf(body: string, maxLength = 200) {
  const paragraph =
    body
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .find((block) => block && !/^(<|!\[|#|>|-|\d+\.)/.test(block)) ?? "";
  const text = paragraph.replace(/[*_`]/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  return text.length > maxLength ? `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}…` : text;
}

function toPost({ slug, data, content }: ReturnType<typeof readDir>[number]): Post {
  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: String(data.title),
    date: String(data.date),
    season: Number(data.season ?? String(data.date).slice(0, 4)),
    excerpt: excerptOf(content),
    readingMinutes: Math.max(1, Math.round(words / 230)),
    body: content,
  };
}

/** All posts, newest first. */
export function getAllPosts(): Post[] {
  return readDir("posts")
    .map(toPost)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function getPost(slug: string) {
  return getAllPosts().find((post) => post.slug === slug);
}

/** Posts grouped by season, newest season first. */
export function getPostsBySeason() {
  const seasons = new Map<number, Post[]>();
  for (const post of getAllPosts()) {
    seasons.set(post.season, [...(seasons.get(post.season) ?? []), post]);
  }
  return [...seasons.entries()].sort(([a], [b]) => b - a);
}

export function getAllPages(): Page[] {
  return readDir("pages").map(({ slug, data, content }) => ({
    slug,
    title: String(data.title),
    body: content,
  }));
}

export function getPage(slug: string) {
  return getAllPages().find((page) => page.slug === slug);
}

// Posts carry WordPress timestamps in league-local (Mountain) time; format in
// that zone so a late-night post doesn't show up dated the next day.
export function formatDate(date: string, style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    month: style === "long" ? "long" : "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
