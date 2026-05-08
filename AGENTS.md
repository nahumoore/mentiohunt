# AGENTS.md

## Project

Mentiohunt is a self-serve distribution tool for founders and small marketing teams. Two parallel engines:

**Backlink Building** — user provides sitemap or article URLs. System auto-fetches daily, finds websites where each article fits well, surfaces contact details for the site owner/founder, and generates a ready-to-send email draft with the recipient address attached.

**Community Monitoring** — system continuously watches relevant communities (Reddit, forums, etc.) for posts that match the user's product. When a fit is found, it generates a suggested reply mentioning the product and sends an email alert so the user can respond while the thread is active.

ICP is founders and small marketing teams. Agency workflows may come later but should not drive early product decisions unless explicitly requested.

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
- Preserve room for future recurring jobs, queue management, and eventual multi-client agency workflows without making agencies the initial ICP.
- Do not present outputs as verified contact intelligence unless the system actually verified them.
- Do not imply backlink acquisition is guaranteed.

## UX Guidance

- The primary UI should help users answer "What should I do next?"
- Queue, opportunity detail, rationale, and outreach prep are more important than analytics-heavy dashboards.
- Prioritize clarity for non-expert founders.
- When showing scores or recommendations, pair them with plain-language reasoning.
- Empty states should teach users what inputs improve discovery quality, especially competitors and keywords.

## Frontend Guidance

- Always use Tabler icons, don't use lucide-react, don't create the svgs yourself or any other icon library.
