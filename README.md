# Blackout Kings Fantasy Football

The league site: weekly power rankings, bylaws and league history. Built with
Next.js and hosted on Vercel. It replaces the old WordPress site at
bkfantasyfootballcom.wordpress.com.

## Posting new rankings

Every post is a Markdown file in `content/posts/`. To publish a new week:

1. Create `content/posts/2026-week-4-rankings.md` (the file name becomes the URL:
   `/rankings/2026-week-4-rankings`).
2. Start it with this header, then write the post underneath:

   ```markdown
   ---
   title: "2026 WEEK 4 RANKINGS"
   date: "2026-10-01T15:00:00-06:00"
   season: 2026
   ---

   Intro paragraph goes here…

   ---

   ### 1. Team Name – Manager

   **Record: 3-0 / PF: 400 / W4 Matchup: Someone**

   Write-up…
   ```

3. Put images in `public/images/2026/` and reference them as
   `![](/images/2026/my-meme.png)`. Add `<img src="…" alt="" width="400" />`
   instead if you want the image smaller.
4. Commit and push. Vercel rebuilds and the post is live in about a minute.

You can do all of this in the GitHub web editor (press `.` on the repo page),
so you don't need anything installed locally.

Formatting tips:
- `### ` headings are team headings; they get the scoreboard-style look.
- `---` on its own line is the gold section divider.
- `> ` makes a quote box.

The About and Bylaws pages are `content/pages/about.md` and
`content/pages/bylaws.md`.

## Local development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build; catches broken pages before deploying
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo, and accept the
   defaults (Vercel detects Next.js).
3. Optional: add a custom domain under **Project → Settings → Domains**, then set
   the `NEXT_PUBLIC_SITE_URL` environment variable to it (e.g.
   `https://blackoutkings.com`) so the sitemap, RSS feed and share links use it.

Every push to `main` deploys to production. Pushes to other branches get preview URLs.

## How it's put together

- `content/`: posts and pages as Markdown.
- `src/lib/content.ts`: reads and sorts the Markdown.
- `src/components/markdown.tsx`: renders Markdown. Images go through `next/image`,
  so visitors get resized WebP/AVIF.
- `src/app/`: routes: `/`, `/rankings`, `/rankings/[slug]`, `/about`, `/bylaws`,
  plus `sitemap.xml`, `robots.txt`, `feed.xml` (RSS) and a generated share image.
- `next.config.ts`: redirects from the old WordPress URL patterns
  (`/2025/10/09/week-6-rankings/` → `/rankings/week-6-rankings`, `/bk-bylaws/` → `/bylaws`, …).

### The WordPress importer

`scripts/import-wordpress.mjs` pulled the original posts, pages and images from
WordPress.com. It was a one-time migration. **Re-running it overwrites
`content/` with whatever is on WordPress**, so only run it if you post something
new on WordPress during the transition and need to bring it over.
