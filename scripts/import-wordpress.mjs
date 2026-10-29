// Importer: pulls every post, page, image and video embed from the WordPress.com
// site and writes them as Markdown into content/ and images into public/images/wp/.
// Safe to re-run (it's how new weekly posts come in); it overwrites the files it
// generated, so fixes belong in this script, not in the Markdown.
//
// Every document is then checked against its WordPress HTML; anything that didn't
// make it across (text, images, embeds) is listed and the script exits non-zero.
//
//   node scripts/import-wordpress.mjs

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const SITE = "bkfantasyfootballcom.wordpress.com";
const API = `https://public-api.wordpress.com/rest/v1.1/sites/${SITE}`;
const ROOT = path.resolve(import.meta.dirname, "..");
const UPLOADS = `https://${SITE}/wp-content/uploads/`;

// The archive page was a WordPress query block; the new site generates it.
const SKIP_PAGES = new Set(["weekly-power-rankings-archive"]);
// Give the bylaws page a cleaner URL (old URL is redirected in next.config.ts).
const PAGE_SLUGS = { "bk-bylaws": "bylaws" };

const decode = (s) =>
  s
    .replace(/&#8217;|&#8216;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&nbsp;/g, " ");

async function fetchAll(type) {
  const res = await fetch(`${API}/posts/?number=100&type=${type}&status=publish`);
  if (!res.ok) throw new Error(`${type}: HTTP ${res.status}`);
  return (await res.json()).posts;
}

// Phone photos were uploaded at full camera resolution; cap originals so the
// repo stays small. next/image still serves resized WebP/AVIF to visitors.
const MAX_WIDTH = 2000;
async function shrink(buffer) {
  const image = sharp(buffer);
  const { width, format } = await image.metadata();
  if (width <= MAX_WIDTH) return buffer;
  return image.resize({ width: MAX_WIDTH }).toFormat(format, { quality: 85 }).toBuffer();
}

const downloaded = new Set();
async function localImage(url) {
  const clean = url.split("?")[0];
  if (!clean.startsWith(UPLOADS)) return url;
  const rel = clean.slice(UPLOADS.length);
  const dest = path.join(ROOT, "public/images/wp", rel);
  if (!downloaded.has(dest)) {
    downloaded.add(dest);
    const res = await fetch(clean);
    if (!res.ok) throw new Error(`image ${clean}: HTTP ${res.status}`);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, await shrink(Buffer.from(await res.arrayBuffer())));
  }
  return `/images/wp/${rel}`;
}

// WordPress renders YouTube blocks as its own player iframe; swap in a plain
// responsive embed titled after the video (titles come from YouTube's oEmbed).
const youtubeId = (html) =>
  /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{11})/.exec(html)?.[1];
const youtubeTitles = new Map();
async function fetchYoutubeTitle(id) {
  if (youtubeTitles.has(id)) return;
  const res = await fetch(
    `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`,
  );
  youtubeTitles.set(id, res.ok ? (await res.json()).title : "YouTube video");
}
const youtubeEmbed = (id) =>
  `<iframe src="https://www.youtube.com/embed/${id}" title="${youtubeTitles.get(id).replace(/"/g, "&quot;")}" style="width: 100%; aspect-ratio: 16 / 9; border: 0; border-radius: 0.5rem;" allow="encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>`;

function makeTurndown(imageMap) {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    emDelimiter: "_",
  });
  td.use(gfm);

  // Images keep the display width the author picked in the WP editor.
  td.addRule("figure", {
    filter: "figure",
    replacement: (content, node) => {
      const img = node.querySelector("img");
      if (!img) {
        const id = youtubeId(node.innerHTML);
        // Unknown figure types fall through as text; checkComplete flags them.
        return id ? `\n\n${youtubeEmbed(id)}\n\n` : `\n\n${content}\n\n`;
      }
      if (isDivider(img.getAttribute("src"))) return "\n\n---\n\n";
      const src = imageMap.get(img.getAttribute("src"));
      const alt = img.getAttribute("alt") || "";
      const width = /width:\s*(\d+)px/.exec(img.getAttribute("style") || "")?.[1];
      return width
        ? `\n\n<img src="${src}" alt="${alt}" width="${width}" />\n\n`
        : `\n\n![${alt}](${src})\n\n`;
    },
  });

  // "Medium font size" paragraphs are the per-team headings in each post.
  td.addRule("teamHeading", {
    filter: (node) =>
      node.nodeName === "P" && node.classList.contains("has-medium-font-size"),
    replacement: (content) => `\n\n### ${content.replace(/\*\*/g, "").trim()}\n\n`,
  });

  td.addRule("emptyParagraph", {
    filter: (node) => node.nodeName === "P" && !node.textContent.trim() && !node.querySelector("img"),
    replacement: () => "",
  });

  return td;
}

// In a few posts the rest of the write-up accidentally ended up inside a quote
// block. A team heading or image inside a quote marks where the quote should
// have ended, so everything from there to the end of the quote is unquoted.
function unquoteRunaways(markdown) {
  let escaping = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (!line.startsWith(">")) {
        escaping = false;
        return line;
      }
      if (/^> (### |<img|!\[)/.test(line)) escaping = true;
      return escaping ? line.replace(/^> ?/, "") : line;
    })
    .join("\n");
}

// Hand fixes for one-off formatting slips in specific posts.
const FIXUPS = {
  "week-2-rankings": (md) =>
    md.replace(/^1\. {2}Catching Cases, Not Passes/m, "### 1. Catching Cases, Not Passes"),
};

async function convert(html) {
  const imageMap = new Map();
  for (const [, raw] of html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)) {
    const src = raw.replace(/&#038;/g, "&");
    if (!isDivider(src)) imageMap.set(src, await localImage(src));
  }
  for (const [figure] of html.matchAll(/<figure[\s\S]*?<\/figure>/g)) {
    const id = youtubeId(figure);
    if (id) await fetchYoutubeTitle(id);
  }
  return unquoteRunaways(makeTurndown(imageMap).turndown(html))
    .replace(/^(#+ \d+)\\\./gm, "$1.")
    .replace(/^>\s*\n(?!>)/gm, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Pictures of a horizontal line the old posts used as section dividers; they
// become real Markdown rules (`---`) instead of white boxes on the dark theme.
const DIVIDER_IMAGES = new Set(["2025/09/image-2.png", "2025/10/image-1.png", "2026/10/image-4.png"]);
const isDivider = (src) => DIVIDER_IMAGES.has(src.split("?")[0].replace(UPLOADS, ""));

// Compares a converted document with its WordPress HTML so nothing is dropped
// silently: every block of text must appear in the Markdown, and the number of
// images and embeds must match. Punctuation and formatting are ignored.
const problems = [];
const words = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(n))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-z]+;/gi, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
function checkComplete(name, html, md) {
  const mdWords = ` ${words(md)} `;
  for (const [, , inner] of html.matchAll(/<(p|li|h[1-6]|figcaption|td|th)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    const text = words(inner.replace(/<[^>]+>/g, " "));
    if (text && !mdWords.includes(` ${text} `)) problems.push(`${name}: missing text "${text.slice(0, 80)}"`);
  }
  const count = (s, re) => (s.match(re) ?? []).length;
  const images = [...html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].filter(([, s]) => !isDivider(s.replace(/&#038;/g, "&")));
  const mdImages = count(md, /!\[[^\]]*\]\(|<img\s/g);
  if (images.length !== mdImages) problems.push(`${name}: ${images.length} images on WordPress, ${mdImages} in Markdown`);
  const embeds = count(html, /<iframe\s/g);
  const mdEmbeds = count(md, /<iframe\s/g);
  if (embeds !== mdEmbeds) problems.push(`${name}: ${embeds} embeds on WordPress, ${mdEmbeds} in Markdown`);
}

const yamlString = (s) => JSON.stringify(s);

async function writeDoc(dir, slug, frontmatter, body) {
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? yamlString(v) : v}`)
    .join("\n");
  const file = path.join(ROOT, "content", dir, `${slug}.md`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `---\n${fm}\n---\n\n${body}\n`);
  console.log("wrote", path.relative(ROOT, file));
}

for (const post of await fetchAll("post")) {
  let title = decode(post.title).replace(/:\s*$/, "").trim();
  const season = Number(/^(\d{4})/.exec(title)?.[1] ?? post.date.slice(0, 4));
  // Titles always lead with the season, even when the author forgot it.
  if (!/^\d{4}/.test(title)) title = `${season} ${title}`;
  const body = (FIXUPS[post.slug] ?? ((md) => md))(await convert(post.content));
  checkComplete(`posts/${post.slug}`, post.content, body);
  await writeDoc("posts", post.slug, { title, date: post.date, season, wordpressUrl: post.URL }, body);
}

for (const page of await fetchAll("page")) {
  if (SKIP_PAGES.has(page.slug)) continue;
  const slug = PAGE_SLUGS[page.slug] ?? page.slug;
  const body = await convert(page.content);
  checkComplete(`pages/${slug}`, page.content, body);
  await writeDoc("pages", slug, { title: decode(page.title).trim(), wordpressUrl: page.URL }, body);
}

console.log(`downloaded ${downloaded.size} images`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s) — content on WordPress that didn't make it across:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exitCode = 1;
}
