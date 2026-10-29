---
description: Import the latest rankings post from WordPress, verify nothing was missed, build, commit and push
argument-hint: "[week number, e.g. 8]"
---

Bring the site up to date with the WordPress site (bkfantasyfootballcom.wordpress.com) and publish it. Expected week: $ARGUMENTS (if blank, take whatever is newest).

The goal is that **everything** on WordPress makes it onto the site: every post, every paragraph, image and video. Last time a YouTube embed was silently dropped, so don't cut corners on step 3.

1. **Sync.** `git pull` so you're working on the latest `main`.

2. **Import.** Run `node scripts/import-wordpress.mjs`. It re-imports every post and page, then compares each one against its WordPress HTML and exits non-zero listing anything that didn't make it across (missing text, image count or embed count mismatch).
   - If it reports problems, fix the **importer** (`scripts/import-wordpress.mjs`), not the Markdown, since the next import overwrites the Markdown. Re-run until it exits cleanly.
   - Never hand-edit files in `content/` to patch import output; that's how fixes got lost before.

3. **Review what changed.** `git status` and `git diff`.
   - Identify the new post(s). If $ARGUMENTS was given and there's no post for that week, the author probably hasn't published yet. Say so and stop; don't commit anything.
   - If existing posts changed, the author probably edited them on WordPress. Keep the changes and mention them in your summary.
   - Read the new post's Markdown top to bottom, then fetch the original from the WordPress API (`https://public-api.wordpress.com/rest/v1.1/sites/bkfantasyfootballcom.wordpress.com/posts/slug:<slug>`) and compare section by section: every team heading (`### N. Team – Manager`) present and in order, record/PF lines, quotes, lists, images, videos and other embeds (tweets, GIFs, Spotify, etc.).
   - Title must start with the season year (e.g. `2026 WEEK 8 RANKINGS`).
   - New images in `public/images/wp/`: open each one. If one is just a horizontal line used as a section divider, add its path to `DIVIDER_IMAGES` in the importer and re-run step 2.
   - Look for conversion junk: leftover HTML tags, stray `\` escapes, empty sections, bold markers in headings.
   - Anything wrong: fix the importer and go back to step 2.

4. **Build.** `npm run build` must succeed.

5. **Commit and push.** Stage the content, images and any importer changes. Commit as `Add <season> Week <N> rankings from WordPress` (mention any other fixes after a semicolon, e.g. `; import Spotify embeds`), then `git push`. Vercel deploys automatically.

6. **Report.** Briefly: which post(s) went live (with the URL `/rankings/<slug>`), counts of team sections, images and videos, any importer fixes, and anything else that changed.
