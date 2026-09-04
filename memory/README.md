# Shared memory

Cross-agent, cross-provider log of *why* non-trivial changes were made — the
context a diff or commit message doesn't carry on its own. Any agent working
in this repo (Claude Code, Codex, etc.) reads and writes here; humans too.

This is separate from any single tool's private memory (e.g. Claude Code's
own per-user memory lives outside the repo) — everything here is checked
into git so every agent and every teammate sees the same history.

## When to add an entry

After finishing any non-trivial change — a bug fix with a non-obvious root
cause, a behavior change, a tradeoff chosen deliberately, a workaround for a
constraint that isn't visible in the code — **ask the user whether it's
worth an entry** rather than adding one unprompted. Skip asking for trivial
changes (typos, formatting, dependency bumps with no story behind them).

## How to add an entry

1. Once the user confirms, create `memory/YYYY-MM-DD-short-slug.md` using
   the format below.
2. Add one line for it to the top of `INDEX.md` (newest first).

## Entry format

```markdown
# Short title

**Date:** YYYY-MM-DD
**Area:** e.g. apps/web/onboarding, apps/server/discovery

What changed, in a sentence or two.

## Why

The non-obvious reason — the constraint, incident, or tradeoff that drove
this. This is the part worth preserving; skip restating what the diff
already shows.

## Watch out for

Optional. Anything a future change in this area should keep in mind.
```

Keep entries short — a few sentences per section is usually enough.
