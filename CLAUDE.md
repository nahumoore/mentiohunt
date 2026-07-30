## Project

Mentiohunt automates backlink prospecting and outreach for founder-led B2B SaaS teams — through the first reply. After that, the founder takes over the relationship personally.

**Core offer:** user provides sitemap or article URLs. System auto-fetches daily, finds websites where each article fits well, surfaces contact details for the site owner/founder, generates a ready-to-send email draft, and runs outreach automatically through a prospect's first reply. Outreach sequences are auto-scheduled on discovery — the customer's role is to monitor and cancel opportunities that aren't a fit, not to approve each one before it sends. Once a prospect replies, automation stops and the customer continues the conversation personally from their own connected mailbox — not from Mentiohunt's shared sending pool.

**Positioning:** more transparent than an agency, less work than outreach software. Every opportunity surfaces a fit rationale (topical relevance, audience overlap, placement angle, expected SEO value) — not just domain metrics.

ICP is founder-led B2B SaaS companies (seed to Series A/B, 2–30 people) who believe SEO matters but cannot justify running link building as an internal function. Agency workflows are a secondary expansion path and should not drive early product decisions.

## Current Repo Shape

This repository is a pnpm monorepo with three apps and shared packages.

**Apps:**
- `apps/web`: main Next.js app using the App Router
- `apps/server`: Express API server — background jobs, onboarding pipeline, discovery methods, outreach generation
- `apps/scraper`: Python scraper service — LLM-driven contact enrichment agent (`agent_enrich.py`), page fetching, email extraction

**Packages:**
- `packages/ui`: shared UI package
- `packages/eslint-config`: shared lint config
- `packages/typescript-config`: shared TypeScript config

Current stack:

- Next.js 16
- React 19
- TypeScript
- Turbo
- pnpm
- shadcn/ui-style component setup in the monorepo

## Commands

Run commands from the repository root unless there is a clear reason not to.

- `pnpm dev`: run the monorepo in development
- `pnpm build`: build all packages
- `pnpm lint`: run linting across the repo
- `pnpm typecheck`: run TypeScript checks

For app-specific work:

- `pnpm --filter web dev`
- `pnpm --filter web build`
- `pnpm --filter web lint`
- `pnpm --filter web typecheck`

## Engineering Guidance

- Keep product language centered on opportunities, queues, scoring, fit, and outreach.
- Avoid generic SEO wording when more specific backlink prospecting language is available.
- Prefer small, composable additions over premature platform abstractions.
- Default to building the thinnest useful version of a workflow before adding automation depth.
- Preserve room for future recurring jobs, queue management, and eventual multi-client agency workflows without making agencies the initial ICP.
- Do not present outputs as verified contact intelligence unless the system actually verified them.
- Do not imply backlink acquisition is guaranteed.
- Community monitoring and social reply automation are not part of the product. Do not design for them or preserve hooks for them.

## UX Guidance

- The primary UI should help users answer "What should I do next?"
- Queue, opportunity detail, rationale, and outreach prep are more important than analytics-heavy dashboards.
- Prioritize clarity for non-expert founders.
- When showing scores or recommendations, pair them with plain-language reasoning.
- Empty states should teach users what inputs improve discovery quality, especially competitors and keywords.

## Frontend Guidance

- Always use Tabler icons, don't use lucide-react, don't create the svgs yourself or any other icon library.

### Landing Section Pattern

Every landing section must follow this structure consistently:

**Section wrapper**

```tsx
<section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
```

**Ambient background blobs** (decorative, pointer-events-none)

```tsx
<div className="pointer-events-none absolute inset-0">
  <div className="absolute ... rounded-full bg-princeton-orange/7 blur-[100px]" />
</div>
```

**Centered section header** — always `mx-auto max-w-2xl text-center`, never a sidebar/split layout:

```tsx
<div className="mx-auto max-w-2xl text-center">
  <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
    Eyebrow
  </span>
  <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
  <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
    Heading
  </h2>
  <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
    Subtext
  </p>
</div>
```

**Content area** — placed below the header, typically `mx-auto mt-14 max-w-6xl`.

## Database Guidance

- Never use `*` for select queries, always specify the columns you need.
- Never query for data on `'use client'` components, data must come from `/store` or from the server pages.

## `apps/server` Guidance

- When adding logs for debugging, only use the helper `apps/server/src/helpers/logger.ts`
