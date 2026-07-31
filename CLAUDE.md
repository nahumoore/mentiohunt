## Project

Mentiohunt automates backlink prospecting and outreach for founder-led B2B SaaS teams — through the first reply. After that, the founder takes over the relationship personally.

**Core offer:** user provides sitemap or article URLs. System auto-fetches daily, finds websites where each article fits well, surfaces contact details for the site owner/founder, generates a ready-to-send email draft, and runs outreach automatically through a prospect's first reply. Outreach sequences are auto-scheduled on discovery — the customer's role is to monitor and cancel opportunities that aren't a fit, not to approve each one before it sends. Once a prospect replies, automation stops and the customer continues the conversation personally from their own connected mailbox — not from Mentiohunt's shared sending pool.

> More brand info at `@.claude/skills/copywriting`

## Rules

- When making changes, always explain system behavior instead of code changes, like if the user doesn't had coding knowledge.

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
