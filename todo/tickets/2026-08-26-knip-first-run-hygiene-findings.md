# Repo hygiene items surfaced by knip's first run (2026-08-26)

## Background

`knip` was added to the repo on 2026-08-26 (`knip.json`, run via `pnpm knip`) as part of a dead-code cleanup, to catch the kind of barrel-masked dead files that stayed invisible for two months previously. Its first run flagged a handful of items unrelated to that cleanup — real, but out of scope for the approved plan, so left for a follow-up pass rather than acted on immediately.

- **`apps/server/test-flip-status.mjs`** and **`apps/server/test-realtime.mjs`** — two tracked, one-off manual debug scripts at the `apps/server` root (a status-flip script hardcoding a specific prospect row ID from 2026-07-13, and a Supabase realtime-channel smoke test). Not imported by anything, not run by any script. Worth deciding whether to keep them as documented debug tools (maybe move to a `scripts/` dir with a comment) or delete.
- **`apps/server` uses the `eslint` binary in its `lint` script but doesn't list `eslint` as a devDependency** — it currently works only because of hoisting from `apps/web`'s install. Add it explicitly to `apps/server/package.json`.
- **`.eslintrc.js`** at the repo root — looks like a leftover from before the ESLint 9 flat-config migration (`eslint.config.js` files now exist per-workspace). Confirm it's unused and delete if so.
- **`packages/ui/package.json` lists `@turbo/gen` as a devDependency with zero usage** — likely leftover from `turbo gen` scaffolding that was run once and never repeated. Low priority.
- **`apps/web/package.json` lists `@tailwindcss/postcss` as a devDependency with zero direct usage** — check whether it's needed transitively via `packages/ui`'s postcss config before removing.
- **`packages/ui/postcss.config.mjs` uses `postcss-load-config` without it being a listed dependency anywhere** — same hoisting-risk pattern as the eslint binary above.

## What's needed

Triage each item above; most are one-line fixes. None are urgent — flagging here so they don't get lost, and so a future `pnpm knip` run isn't mistaken for finding new regressions when it's really just these pre-existing items.
