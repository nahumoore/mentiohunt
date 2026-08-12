# Make /dashboard tab and filter state URL-friendly

## Background

Dashboard pages with tabs, status filters, sort, search, or pagination keep that state
in React `useState` instead of URL search params. Result: can't share/bookmark a filtered
view (e.g. `/dashboard/prospects?status=new`), back button doesn't undo a filter change,
reload resets to default view.

## Scope — pages to migrate

1. **Prospects pipeline** — `apps/web/components/link-building/prospects/prospect-pipeline.tsx`
   Stage filter (all/new/contacted/negotiating/won/dismissed/email_not_found/bounced) +
   column sort (contact/domain/dr/relevance, asc/desc). Partially wired already — reads
   `?stage=` once on mount via `useInitialStage()`, but never writes back to URL after
   user changes stage/sort. Need two-way sync.

2. **Link Tracker** — `apps/web/components/link-tracker/link-tracker-client.tsx`
   Status filter pills (all/live/nofollow/target_changed/removed/page_dead/check_failed/pending)
   + free-text search. Currently pure `useState`, no URL params at all.

3. **Directories** — `apps/web/app/dashboard/directories/page.tsx`
   Search box + column sort (domain/domain_rating/backlinks, asc/desc). Pure `useState`.

4. **Pages** — `apps/web/components/pages/pages-client.tsx`
   Search + column sort (page/type/priority/opportunities, asc/desc) + pagination
   (`currentPage`). Pure `useState`.

5. **Settings** — `apps/web/app/dashboard/settings/page.tsx`
   Tabs: profile/notifications/billing/password. Uncontrolled shadcn `Tabs`
   (`defaultValue`), not linkable, resets on reload.

6. **Prospects Settings** — `apps/web/app/dashboard/prospects/settings/page.tsx`
   Tabs: backlink-types/competitors/seo-metrics/outreach. Same uncontrolled pattern.

Out of scope (checked, no tab/filter UI): email-accounts, network, billing, top-level
dashboard page (already URL-driven), prospect detail page's email-index switcher.

## Next steps

1. Pick one shared pattern — likely a `useQueryState`-style hook (or `nuqs` if we want
   to add the dep) wrapping `useSearchParams` + `router.replace` (no history entry per
   keystroke/filter change, so back button isn't spammed).
2. Migrate prospect-pipeline first (most-used page, already half-wired) to validate the
   pattern.
3. Roll out to link-tracker, directories, pages-client (search/sort/pagination all follow
   same shape).
4. Convert settings + prospects/settings tabs from uncontrolled shadcn `Tabs` to
   controlled `value`/`onValueChange` synced with `?tab=`.
5. Update any internal links that currently point at these pages (e.g. dashboard's
   "Needs you" panel) to use the new query param shape where useful.
