# Known issue: `user_signed_up` never fires for OAuth signups, plus a real crash and error-tracking noise on `/onboarding`

## Summary

Investigated why the marketing funnel looked broken in PostHog (only 2 of 13
`signup_started` events over 60 days converted to `user_signed_up`, a 15%
apparent conversion rate). Per-person event traces
(`execute-sql` against `events`, Mentiohunt PostHog project, queried
2026-09-01) show real completion is actually 7 of 13 (54%) — `user_signed_up`
just never fires for the OAuth signup path, only the email/password path. That
tracking gap makes every signup funnel/dashboard built on `user_signed_up`
understate real signups by ~3.5x today.

While tracing the drop-off, also found a real repeating frontend crash on
`/onboarding` and a very likely false-positive error flooding PostHog error
tracking.

## Root cause

1. **`user_signed_up` is only captured on the email/password path.**
   `apps/web/components/auth/signup-form.tsx:96` calls
   `captureEvent("user_signed_up", { method: "email", ... })` directly in the
   client component. The OAuth path never touches this component after the
   redirect back from the provider — `apps/web/app/api/auth/callback/route.ts`
   exchanges the code server-side and calls `handlePostSignin`
   (`apps/web/app/api/auth/_handle-new-user.ts:20-73`), which detects a
   brand-new user at the `!profile` branch (line 30) and creates their
   `profiles` row, but never emits any signup analytics event — server-side or
   client-side — before redirecting to `/onboarding`. Confirmed via raw event
   traces: multiple `person_id`s show `oauth_started` → `signup_page_viewed` →
   `signup_started` → `onboarding_completed` with **no** `user_signed_up`
   event anywhere in their history (e.g. persons `23bb8ce8`, `d951c9ab`,
   `bd9e7909`, `0762f4e6`), while the only two people who do have
   `user_signed_up` both went through `email_confirmation_started` /
   `email_confirmation_completed`.

2. **Real crash loop on `/onboarding`: React DOM reconciliation error.**
   PostHog captured `$exception` events with
   `$exception_types: ["DOMException"]`,
   `$exception_values: ["NotFoundError: Failed to execute 'insertBefore' on
   'Node': The node before which the new node is to be inserted is not a
   child of this node."]` — 6 occurrences for one person in under a minute on
   `https://mentiohunt.com/onboarding`, plus one `removeChild` variant of the
   same error for a different person. This is the classic signature of
   something manipulating the DOM outside React's control (a browser
   extension, or a ref-based DOM mutation racing a React re-render) inside the
   onboarding flow, and it correlates with that person never completing
   onboarding despite multiple `signup_started` attempts across different
   days (person `b1f4a2ae`: 4 separate signup attempts over 4 days, never
   completed; person `2fd2bdb2`: 2 attempts same day, never completed — both
   hit exceptions on `/onboarding`).

3. **`Error: NEXT_REDIRECT` is very likely a false positive polluting error
   tracking.** 5 occurrences across 4 distinct people on `/onboarding`. Next.js
   App Router's `redirect()` intentionally throws this string internally as
   its control-flow mechanism — Next.js is supposed to catch it before it
   reaches the browser's global error handler, but PostHog's exception
   autocapture (`apps/web/lib/analytics.ts:22-28`, `posthog.init(...)` with no
   `before_send`/exception filtering configured) is recording it as an
   unhandled exception anyway. This inflates error counts without indicating
   any real user-facing failure.

## Impact

- Any dashboard, funnel, or alert built on the `user_signed_up` event
  undercounts real signups by roughly 3.5x (2 tracked vs. 7 real completions
  over the last 60 days) and is currently unusable as a source of truth for
  signup volume or acquisition-channel attribution.
- The `/onboarding` DOM crash appears to be a real, reproducible technical
  blocker for at least some users who otherwise show clear intent (repeated
  signup attempts across multiple days).
- `NEXT_REDIRECT` noise makes PostHog's error-tracking error-rate numbers for
  `/onboarding` look worse than reality, which could mask the real crash above
  in aggregate views or waste investigation time on a non-issue.

## Recommendation (not yet actioned)

- Fire `user_signed_up` (or an equivalent, e.g. `oauth_signed_up`) server-side
  in `handlePostSignin`'s `!profile` branch
  (`apps/web/app/api/auth/_handle-new-user.ts:30-65`), using PostHog's
  server-side capture (Node SDK) rather than relying on a client component the
  OAuth redirect never renders. Include `method: "oauth"` / provider so the
  two signup paths stay distinguishable in analytics.
- Reproduce and root-cause the `insertBefore`/`removeChild` `DOMException` on
  `/onboarding` (`apps/web/app/onboarding/page.tsx`) — check for browser
  extension interference vs. a real conditional-render/key bug, and check
  whether it correlates with a specific browser/OS via `$browser`/`$os`
  properties on the affected events.
- Add exception filtering (PostHog `before_send` in
  `apps/web/lib/analytics.ts`, or the equivalent suppression rule in PostHog's
  error tracking settings) to drop `Error: NEXT_REDIRECT` so it stops
  appearing as an unhandled exception.

## Relevant files

- `apps/web/components/auth/signup-form.tsx:96,108`
- `apps/web/components/auth/signin-form.tsx:268`
- `apps/web/app/api/auth/callback/route.ts`
- `apps/web/app/api/auth/_handle-new-user.ts:20-73`
- `apps/web/lib/analytics.ts:12-32`
- `apps/web/lib/analytics-events.ts`
- `apps/web/app/onboarding/page.tsx`
