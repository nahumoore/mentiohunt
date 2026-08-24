# PostHog Self-driving Setup Report

**Date:** 2026-08-24  
**Project:** Mentiohunt (project 422640)  
**Inbox:** https://us.posthog.com/project/422640/inbox

## Summary

Session Replay, Error Tracking, and Support (Conversations) were enabled; six native signal sources were wired to the inbox; GitHub was connected; and the scout troop was tuned to five scouts targeting the product's most-used surfaces. Two Replay Vision scanners were created with `emits_signals: true` so on-screen breakage and user frustration surface in the inbox automatically. Findings will start appearing in the [Self-driving inbox](https://us.posthog.com/project/422640/inbox) within ~30 minutes.

---

## AI Data Processing

**Approved.** Organization-level AI data processing consent was granted before this run.

---

## GitHub

**Connected during this run.**  
Integration ID: 246186  
GitHub account/org: `nahumoore`  
Self-driving can now research findings against your code and open draft PRs.

---

## Products Enabled

| Product | Result | Notes |
|---|---|---|
| Session Replay | **already enabled** | Server-side toggle was already on |
| Error Tracking | **enabled** | Turned on during this run |
| Support (Conversations) | **enabled** | Turned on during this run; tickets only arrive once an inbound channel is connected — see Follow-ups |

**`posthog.init` override check:** Clean. `apps/web/lib/analytics.ts` has neither `disable_session_recording: true` nor `capture_exceptions: false` — both server-side enables take effect immediately.

---

## Signal Sources

| Source product | Source type | Action |
|---|---|---|
| `signals_scout` | `cross_source_issue` | **ON by default** — no row needed; scout findings reach the inbox automatically |
| `health_checks` | `health_issue` | **enabled** (id: `01a0345b-a80a-715f-b8d1-b6af27ff2bac`) |
| `error_tracking` | `issue_created` | **enabled** (id: `01a0345b-ad72-71da-ba3f-b900fa116382`) |
| `error_tracking` | `issue_reopened` | **enabled** (id: `01a0345b-af89-76f8-bb04-254dca59db71`) |
| `error_tracking` | `issue_spiking` | **enabled** (id: `01a0345b-bffb-7077-9f77-ec6c93b9f86f`) |
| `session_replay` | `session_analysis_cluster` | **enabled**, sample rate 0.1 (id: `01a0345b-c4f8-78b7-afa5-d495221fc634`) |
| `conversations` | `ticket` | **enabled** (id: `01a0345b-c6c4-7b2f-8a54-e0e1d445c127`) — dormant until a support channel is connected |
| `replay_vision` | — | **self-authorizing** — no row; `emits_signals: true` on each scanner is the per-source config |
| `llm_analytics` | — | **skipped** — not a user-facing responder |
| `logs` | — | **skipped** — not a v1 responder |

---

## Connected Tools

No connected-tool sources were selected. The ask was cancelled, which is treated as "None of these."

All tools (GitHub Issues, Linear, Jira, Sentry, Zendesk, and the rest of the catalog) are **not used** — no responder rows or warehouse sources created.

You can connect any of them later via the [new source page](https://us.posthog.com/project/422640/pipeline/new/source).

---

## Scout Troop

**Run budget:** 100 runs/day (early access default). 0 used today. Max 3 runs per scheduler tick.  
**Banner:** "Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."

### Enabled (5 scouts)

| Scout | Why enabled |
|---|---|
| `signals-scout-general` | Always on — cross-product correlations and surfaces no specialist covers |
| `signals-scout-product-analytics` | 47 tracked events across a clear signup → onboarding → opportunities → outreach funnel |
| `signals-scout-revenue-analytics` | Stripe SDK is installed in `apps/web` — active payment flows |
| `signals-scout-web-analytics` | `capture_pageview: true` in posthog.init; landing pages, pricing page, and SEO content drive measurable traffic |
| `signals-scout-observability-gaps` | 47 events with likely minimal insight/dashboard coverage — surfaces what needs charting |

### Disabled (22 scouts)

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | **Intentional** — covered by the native `error_tracking` source (steps 3b + 4) |
| `signals-scout-session-replay` | **Intentional** — covered by the native `session_replay` source (steps 3b + 4) |
| `signals-scout-feature-flags` | No feature flag calls found in codebase |
| `signals-scout-surveys` | 0 surveys in project; no survey code in repo |
| `signals-scout-experiments` | No A/B experiments in use |
| `signals-scout-ai-observability` | No `$ai_*` events; LLM usage is server-side via workspace package without PostHog instrumentation |
| `signals-scout-logs` | PostHog logs product not in use |
| `signals-scout-csp-violations` | No CSP configuration found in the project |
| `signals-scout-customer-analytics` | No group/accounts analytics calls in the codebase |
| `signals-scout-data-pipelines` | No CDP destinations, hog flows, or batch exports |
| `signals-scout-data-warehouse` | No warehouse imports active |
| `signals-scout-conversations` | No support ticket volume yet; can enable later as Conversations usage grows |
| `signals-scout-replay-vision` | Step 6c scanners were just created — no accumulated observations for trend analysis yet |
| `signals-scout-anomaly-detection` | Covered adequately by general + specialists |
| `signals-scout-health-checks` | Covered by the native `health_checks` source |
| `signals-scout-inbox-validation` | Fresh setup — no shipped fixes to validate yet |
| `signals-scout-apm` | No distributed tracing / OpenTelemetry spans |
| `signals-scout-mcp-tool-calls` | No MCP telemetry |
| `signals-scout-insight-alerts` | No alerts configured |
| `signals-scout-skills-store` | Not relevant |
| `signals-scout-tasks` | Not relevant |
| `signals-scout-web-vitals` | Secondary; can enable if Core Web Vitals become a focus |

**Re-enable note:** To turn on any surface-specific scout later, go to PostHog and flip its enabled toggle in the Self-driving settings.

---

## Custom Scouts

Two candidates were identified and proposed; both were declined.

| Candidate | Surface | Why no built-in covers it | Decision |
|---|---|---|---|
| `signals-scout-onboarding-funnel` | `onboarding_started` → `onboarding_step_completed` (by step) → `onboarding_completed` | `product-analytics` only watches saved funnel flows; no onboarding funnel is saved yet | **Declined** |
| `signals-scout-outreach-activation` | `opportunity_viewed` → `outreach_email_copied` / `outreach_open_in_client` ratio | Same — no outreach engagement flow is saved in PostHog | **Declined** |

Both can be added later if you want coverage for these flows. To reduce noise on a custom scout once created: set `emit: false` on its config in PostHog to switch it to dry-run mode.

---

## Replay Vision Scanners

Replay Vision scanners are LLM agents that watch individual session recordings on a schedule and push what they find to the inbox. Findings arrive at **half weight** — a report is promoted only when two independent findings corroborate. Both scanners were created with `emits_signals: true`; they cost nothing until recordings exist and start working automatically the day they do.

**No recordings exist yet** — the scanners are armed and waiting.

### Breakage monitor — "Onboarding and prospect breakage"

| Field | Value |
|---|---|
| Scanner ID | `01a03465-5880-78d0-9343-65612a4758dc` |
| Type | monitor |
| Query scope | Sessions visiting `/onboarding` (URL icontains) |
| Sampling rate | 0.5 (50% of matching sessions) |
| Model | `gemini-3-flash-preview` (5 credits/observation) |
| Estimated monthly spend | 0 credits (no recordings yet) |
| `emits_signals` | true |

Watches the onboarding activation flow — the highest-stakes surface where silent breakage (spinner loops, failed URL fetches, blank draft areas) would silently kill activation for new users.

### Frustration monitor — "Prospect outreach frustration"

| Field | Value |
|---|---|
| Scanner ID | `01a03465-87ff-702a-89e1-c9d27517573e` |
| Type | monitor |
| Query scope | Sessions with a `$rageclick` event (no URL scope) |
| Sampling rate | 1.0 (all matching sessions) |
| Model | `gemini-3-flash-preview` (5 credits/observation) |
| Estimated monthly spend | 0 credits (no recordings yet) |
| `emits_signals` | true |

Watches any session where a user rage-clicked — catches the outreach dashboard friction (copy-button hammering, mail-client retries, stuck wizard steps) that events alone can't see.

---

## Follow-ups

- [ ] **Connect a support inbound channel** — Support (Conversations) is on, but tickets only arrive once you connect an inbound channel (email, inbox, or Slack) in PostHog. Settings → Conversations.
- [ ] **Connect a connected-tool source** — GitHub Issues, Linear, Jira, Sentry, Zendesk, and others can feed the inbox. Each open record Self-driving judges fixable gets a draft PR at $15 each. Add any at: https://us.posthog.com/project/422640/pipeline/new/source
- [ ] **Save funnel insights** — The `signals-scout-product-analytics` scout watches *saved* funnels. Create a signup→onboarding funnel and an opportunity→outreach-action funnel in PostHog so the scout has flows to monitor.
- [ ] **Connect Stripe to PostHog revenue analytics** — `signals-scout-revenue-analytics` is enabled but Stripe data isn't flowing into PostHog yet. Connect the Stripe integration in PostHog to make the revenue scout actionable.
- [ ] **Enable custom scouts for onboarding and outreach** — If you want a scout that watches these event-level funnels without saved insights, the two proposed scouts (onboarding-funnel, outreach-activation) can be created from the inbox settings. They were proposed and declined during this run.
- [ ] **Enable `signals-scout-conversations`** — Once support ticket volume grows, enable this scout from PostHog to surface SLA and backlog regressions.

---

## What Happens Next

- The scout coordinator picks up fresh configs within **~30 minutes**; first scans will fire shortly after.
- Scout runs draw from the project's **100 runs/day** early-access budget.
- Replay Vision scanners run on a 5-minute sweep cycle — they cost nothing until recordings arrive.
- Findings cluster into reports in the inbox; immediately-actionable ones can automatically start coding tasks.
- View your inbox: https://us.posthog.com/project/422640/inbox
