# Known issue: unsanitized blog slug lets bot/scanner probes log as errors

## Summary

`apps/web/app/blog/[slug]/page.tsx` (`generateMetadata` and `BlogArticlePage`) passes
the URL `slug` param straight into `getPostBySlug(slug, "articles")` with no allowlist
check. Observed on Vercel via `mcp__vercel__get_runtime_errors`:
- `Error processing .env.mdx: ENOENT ... /apps/web/resources/articles/.env.mdx` — 2x,
  2026-07-21T08:23:09Z, deployment `dpl_GPxH85zhPSmfi1qJvdScqJ3oV5yt`
- `Error processing unlinked.mdx: ENOENT ... /apps/web/resources/articles/unlinked.mdx` — 2x,
  2026-07-15T19:04:41Z, deployment `dpl_5a8FGWyKdqtAA8vrWuhgnaSTcQie`

Neither `.env.mdx` nor `unlinked.mdx` exist in `apps/web/resources/articles/` — these
are requests to `/blog/.env` and `/blog/unlinked`, most likely automated scanners
probing for exposed `.env` secrets and stale/renamed links, not real content requests.

## Root cause

`apps/web/lib/mdx.ts:89-136` (`getPostBySlug`) builds the file path directly from the
caller-supplied slug (`path.join(contentDirectory, \`${slug}.mdx\`)`) and wraps the
read in try/catch, but the catch does `console.error(\`Error processing ${slug}.mdx:\`, error)`
unconditionally — it doesn't distinguish "file doesn't exist" (expected for a bad slug)
from a real read failure. `apps/web/app/blog/[slug]/page.tsx:89-91` and the
`generateMetadata` function above it call `getPostBySlug` with the raw route param
before checking it against `getResourceSlugs("articles")`, so any string in the URL
reaches the filesystem call.

## Impact

No data loss — `getPostBySlug` returns `null`, `notFound()` fires, request gets a
correct 404. Purely log noise: every scanner/bot hit against `/blog/<anything>` logs
as a `console.error`, which is what surfaced this in Vercel's runtime-error grouping
as if it were an application defect. Recurring pattern — will keep firing for every
new bogus slug a scanner tries (`.env`, `unlinked` are just the two seen so far), and
each new slug shows up as a distinct "unseen" error group rather than a single known
noise source.

## Recommendation (not yet actioned)

- In `getPostBySlug`'s catch block, check `error.code === 'ENOENT'` and return `null`
  silently (or `console.warn` at most) instead of `console.error` — reserve `console.error`
  for read failures that aren't "slug doesn't exist."
- Alternatively/additionally, validate `slug` against `getResourceSlugs("articles")`
  in the page and `generateMetadata` before calling `getPostBySlug`, so unknown slugs
  short-circuit to `notFound()` without ever touching the filesystem.
- Either fix removes this from future Vercel error-group noise; low priority otherwise
  since nothing is actually broken.
