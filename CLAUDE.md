## Project

Mentiohunt automates backlink prospecting and outreach for founder-led B2B SaaS teams, up to a prospect's first reply — after which the founder takes over the relationship personally.

> For product, positioning, pricing, ICP, and messaging details needed for marketing or copywriting tasks, see `@docs/mentiohunt`.

## General Knowledge/Rules

- When making changes, always explain system behavior instead of code changes, like if the user doesn't had coding knowledge.
- Don't use `claude-in-chrome` without user permission.
- When talking about support messages, they are on the DB `packages/supabase/database-types.ts`
- Shared, cross-agent memory lives in `memory/` (see `memory/README.md`). Check it before a non-trivial change in an area it might cover. After finishing a non-trivial change, ask the user whether it's worth a memory entry — don't add one without asking first.

## Current Repo Shape

This repository is a pnpm monorepo with three apps and shared packages.

**Apps:**

- `apps/web`: main Next.js app using the App Router
- `apps/server`: Express API server — background jobs, onboarding pipeline, discovery methods, outreach generation
- `apps/scraper`: Python scraper service — LLM-driven contact enrichment agent (`agent_enrich.py`), page fetching, email extraction

## Frontend Rules

- Always use Tabler icons, don't use lucide-react, don't create the svgs yourself or any other icon library.

## Server Rules

- When adding logs for debugging, only use the helper `apps/server/src/helpers/logger.ts`

## SEO

- Principal Target keyword `automated link building tool`
