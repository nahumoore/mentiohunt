# Dashboard sidebar agent — control the platform + learn what users actually want

- **Status:** Proposed — not started
- **Priority:** P1
- **Scope:** A conversational agent panel inside the dashboard that lets a signed-in user ask
  questions and drive common platform actions in plain language, while capturing every prompt as
  first-party product research.
- **Primary objective:** Understand what users search for, ask about, get stuck on, and doubt.
  The captured conversation log is the deliverable that matters most — the action-taking is what
  makes users willing to talk to it in the first place.

## Why

We have very little visibility into what a paying user is trying to do at any moment. The founder
sees outcomes (opportunities dismissed, outreach paused, trial cancelled) but not the intent behind
them. The existing support chat (`components/support-chat/`) is a founder-manned live channel — it
only captures the small fraction of users who hit a wall bad enough to message a human, and the
founder has to be present to answer.

A dashboard agent that is genuinely useful — one that can answer "why did discovery find nothing for
my site?" or "pause outreach for the next week" without the user leaving the page — will get used
routinely, not just in a crisis. Every one of those turns is a labelled signal: what vocabulary
users use, what they expect the product to do, where the mental model breaks, which features they
can't find, what they think is broken that isn't.

This is distinct from the support chat. Support chat stays as-is for "I need a human." This agent is
for "help me use the thing."

## What it does — two jobs

### 1. Answer and explain (read-only)

The agent can read the signed-in user's own account state and answer questions about it:

- discovery status per strategy, and why a strategy produced nothing (no crawled target page, no
  usable competitor, source exhausted);
- what a given opportunity type means and why a specific prospect was surfaced;
- outreach state — what's scheduled, what's sending, what's paused, pool delays for free tier;
- account/billing basics — trial end date, tier, what changes on upgrade;
- "where is X" navigation help (settings lives under `/dashboard/settings`, etc.).

### 2. Take actions (write, always confirmed)

A bounded set of actions the user could otherwise do by clicking around. Every action is previewed
and requires an explicit confirm in the panel before it runs — the agent proposes, the user commits.

Candidate v1 action set (finalise during build):

- adjust discovery settings — toggle opportunity types, change DR min/max;
- pause / resume outreach;
- dismiss or restore a named opportunity;
- edit voice tone / offering text;
- enable or disable the backlink network membership;
- add a target page URL or a tracked link.

Explicitly **not** in v1: anything that spends money, sends an email immediately, deletes an
account, changes the connected mailbox, or touches another user's data.

## Capture — the actual point of this ticket

Persist every conversation in full:

- user message text, verbatim, timestamped;
- agent response;
- the route/page the user was on when they asked (`usePageContext` already does this for support
  chat — reuse the pattern);
- which tool/action the agent chose, if any, and whether the user confirmed, edited, or cancelled
  it;
- resolved vs. abandoned (did the user get an answer or drop off);
- product id / tier / trial state at time of asking, for segmentation.

New tables (create via Supabase CLI migration, regenerate types):

- `agent_conversations` — one row per thread, per user, with account snapshot columns.
- `agent_messages` — role (`user` / `agent` / `tool`), body, page_url, tool_name,
  tool_status (`proposed` / `confirmed` / `cancelled`), created_at.

RLS: a user can read/write only their own conversations. The founder reads everything through
`supabaseAdmin` in an internal view — not part of this ticket, but the schema must not block it.

### Making the capture usable

Raw logs rot unread. Alongside the tables:

- a simple internal page (or a scheduled digest) listing recent conversations, newest first, with
  the page context and whether an action was taken;
- weekly rollup: top question themes (LLM-clustered), most-requested actions, count of
  "agent couldn't help" turns, routes where questions cluster.

The rollup is what turns this from a chat feature into a research instrument. Ship at least the
list view in v1; the clustering rollup can be a fast follow.

## Surface / UX

- Lives in the dashboard shell (`apps/web/app/dashboard/layout.tsx`), available on every dashboard
  route. A slide-over panel from the right, opened from a persistent affordance in the sidebar
  (`components/dashboard/app-sidebar.tsx`) or header (`dashboard-header.tsx`) — not a floating
  bubble, so it reads as "assistant," not "support."
- Must visually and positionally not collide with the existing support-chat bubble. Decide during
  build whether support chat stays a bubble, moves into this panel as a "talk to a human" tab, or
  both.
- Streamed responses. Tabler icons only.
- Empty state should seed 3–4 example prompts — these also nudge users toward phrasings we can
  learn from.

## Implementation notes

- LLM calls go through `@workspace/openrouter` (`generateTextWithUsage`, `OPENROUTER_MODELS`),
  same as the server discovery methods. Tool-calling loop on the server side.
- New API routes under `apps/web/app/api/agent/` (thread bootstrap, send message, confirm action),
  or an `apps/server` route if the tool actions are easier to run there — the write actions mostly
  map to existing server/DB operations, so prefer wherever those already live.
- The agent's tools are thin wrappers over existing mutations (discovery settings update, outreach
  pause, opportunity dismiss). Do not reimplement business logic inside the agent — call the same
  paths the UI buttons call.
- System prompt must scope the agent hard: it only ever acts on the current signed-in user's
  account, never guesses at data it can't read, never promises outreach behaviour it can't verify,
  and always hands off to support chat for anything outside its tool set.
- Rate-limit per user. Log token usage per conversation for cost visibility.

## Safety / guardrails

- Every write action requires in-panel confirmation showing exactly what will change.
- No action can exceed what the user could do themselves in the UI (same permission surface).
- No money movement, no immediate sends, no destructive account actions in v1.
- Prompt-injection: treat any content the agent reads from the DB (prospect domains, page titles,
  user-entered voice tone) as data, not instructions.
- Conversation logs may contain PII the user types — store in-region, cover with existing data
  retention/deletion policy, and delete with the account.

## Tests

- Agent answers account questions using only the signed-in user's data; a second user's data is
  never readable.
- Every write action is blocked until confirmed; cancel leaves state untouched and is logged as
  `cancelled`.
- Each tool wrapper produces the same result as the equivalent UI action.
- Every message (user, agent, tool) is persisted with page_url and account snapshot.
- RLS: user A cannot select user B's `agent_conversations` / `agent_messages`.
- New enum/columns are covered by regenerated types and handled in mappings.
- Agent refuses and points to support chat for out-of-scope requests (billing disputes, "delete my
  account", "email this prospect now").

## Rollout

1. Ship read-only Q&A + full capture first. No write actions. Watch the logs for a week to see what
   users actually ask before deciding which actions are worth building.
2. Add the v1 action set behind the confirmation flow, one action at a time.
3. Add the weekly theme rollup once there's a corpus to cluster.
4. Revisit the action set and system prompt monthly against what the logs show users trying to do.

## Relevant files

- `apps/web/app/dashboard/layout.tsx` — dashboard shell, where the panel mounts
- `apps/web/components/dashboard/app-sidebar.tsx`, `dashboard-header.tsx` — open affordance
- `apps/web/components/support-chat/` — pattern to follow for panel, polling/streaming, page
  context capture; also the thing to not collide with
- `apps/web/components/support-chat/use-page-context.ts` — reuse for route capture
- `apps/web/app/api/support-chat/` — API route shape reference
- `packages/openrouter/` — LLM call helpers (`generate-text`, `models`)
- `packages/supabase/database-types.ts` — regenerate after the migration
- `apps/web/lib/opportunity-types.ts` — strategy/tier vocabulary the agent must explain correctly
- `supabase/migrations/` — new `agent_conversations` / `agent_messages` tables + RLS
