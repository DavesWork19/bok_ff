// One-off importer: pulls every post, page and image from the old WordPress.com
// site and writes them as Markdown into content/ and images into public/images/wp/.
// Safe to re-run; it overwrites the files it generated.
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
    replacement: (_content, node) => {
      const img = node.querySelector("img");
      if (!img) return "";
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
  return unquoteRunaways(makeTurndown(imageMap).turndown(html))
    .replace(/^(#+ \d+)\\\./gm, "$1.")
    .replace(/^>\s*\n(?!>)/gm, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Pictures of a horizontal line the old posts used as section dividers; they
// become real Markdown rules (`---`) instead of white boxes on the dark theme.
const DIVIDER_IMAGES = new Set(["2025/09/image-2.png", "2025/10/image-1.png"]);
const isDivider = (src) => DIVIDER_IMAGES.has(src.split("?")[0].replace(UPLOADS, ""));

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
  const title = decode(post.title).replace(/:\s*$/, "").trim();
  const season = Number(/^(\d{4})/.exec(title)?.[1] ?? post.date.slice(0, 4));
  await writeDoc(
    "posts",
    post.slug,
    { title, date: post.date, season, wordpressUrl: post.URL },
    (FIXUPS[post.slug] ?? ((md) => md))(await convert(post.content)),
  );
}

for (const page of await fetchAll("page")) {
  if (SKIP_PAGES.has(page.slug)) continue;
  await writeDoc(
    "pages",
    PAGE_SLUGS[page.slug] ?? page.slug,
    { title: decode(page.title).trim(), wordpressUrl: page.URL },
    await convert(page.content),
  );
}

console.log(`downloaded ${downloaded.size} images`);
