# AGENTS.md

## Project

Mentiohunt is a self-serve backlink and mentions prospecting tool.

It helps founders and small agencies discover relevant websites where they can potentially earn backlinks or brand mentions. Users provide their site, product description, niche, target keywords, and competitors. The product then runs recurring discovery jobs and produces a weekly queue of qualified outreach opportunities with clear next steps.

This product is about opportunity discovery and outreach preparation, not guaranteed backlink acquisition.

## Core User Outcome

Users should open the product and quickly understand:

- which sites are worth pursuing this week
- why each site is a fit
- what action to take next
- what outreach angle to use
- who to contact when contact data is available

Every feature should move the product toward a simple weekly queue of backlink actions rather than a generic SEO dashboard.

## ICP

### Primary ICP

Small SaaS founders and indie founders trying to build backlinks without hiring an SEO agency.

### Secondary ICP

Small SEO or content agencies that need repeatable backlink prospecting for multiple clients.

### Best-Fit Users

- have a live SaaS, tool, newsletter, marketplace, or content site
- have at least 3 to 10 known competitors
- understand that backlinks matter for SEO
- already publish content or are starting SEO seriously
- do not want to manually search Google for opportunities
- do not want to manually inspect competitor backlink profiles
- want a simple weekly queue of backlink actions
- are willing to pay roughly $49 to $99 per month
- prefer self-serve software over hiring a link-building agency

## What The Product Should Find

Discovery should focus on opportunities such as:

- directories
- niche resource pages
- listicles
- "best tools" articles
- competitor mention pages
- alternative pages
- partner pages
- blogs covering similar products

The product should favor actionable, explainable opportunities over large undifferentiated domain lists.

## Opportunity Record Expectations

Each opportunity should aim to include:

- relevance score
- opportunity type
- target site or page
- why the site is a fit
- suggested next step
- suggested outreach angle
- contact info when available
- ready-to-send outreach draft

Examples of next steps:

- submit to this directory
- pitch this listicle
- ask to be added to this resource page
- contact this site owner
- mention a competitor gap
- send this personalized outreach draft

## Product Principles

- Actionability over volume: a smaller queue of strong opportunities is better than a large noisy export.
- Explainability over black box scoring: users should understand why an opportunity was surfaced.
- Recurring value over one-time scans: the product should feel like a weekly operating system for backlink work.
- Self-serve simplicity over agency complexity: avoid workflows that assume dedicated SEO specialists.
- Draft assistance over false promises: help users prepare strong outreach, but do not imply guaranteed placements.

## Current Repo Shape

This repository is a pnpm monorepo.

- `apps/web`: main Next.js app using the App Router
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

- Keep the product language centered on opportunities, queues, scoring, fit, and outreach.
- Avoid generic SEO wording when more specific backlink prospecting language is available.
- Prefer small, composable additions over premature platform abstractions.
- Default to building the thinnest useful version of a workflow before adding automation depth.
- Preserve room for future recurring jobs, queue management, and multi-client agency workflows.
- Do not present outputs as verified contact intelligence unless the system actually verified them.
- Do not imply backlink acquisition is guaranteed.

## UX Guidance

- The primary UI should help users answer "What should I do next?"
- Queue, opportunity detail, rationale, and outreach prep are more important than analytics-heavy dashboards.
- Prioritize clarity for non-expert founders.
- When showing scores or recommendations, pair them with plain-language reasoning.
- Empty states should teach users what inputs improve discovery quality, especially competitors and keywords.

## Early Feature Bias

When tradeoffs are unclear, bias toward features that improve:

- opportunity discovery quality
- recurring weekly queue usefulness
- outreach preparation speed
- trust in why opportunities were selected

Bias away from:

- broad SEO reporting
- vanity metrics
- backlink monitoring features unrelated to discovery
- CRM-like complexity unless it directly supports outreach execution

## Notes For Future Contributors

- Replace the template `README.md` with product-specific documentation as the app takes shape.
- Treat `.next` output as generated artifacts, not source of truth.
- If adding new flows, anchor naming around prospects, opportunities, queues, outreach, and competitors.
