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
