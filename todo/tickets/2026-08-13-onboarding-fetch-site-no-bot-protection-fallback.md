# Known issue: onboarding's "fetch my site" step has no fallback for basic bot protection, unlike the rest of the product

## Summary

Support message from Michael Alexis (michael@teambuilding.com, `support_conversations.id = 03adcb4a-be1b-4555-ae9a-aed889d24aad`), 2026-08-13 15:14 UTC: "tool is returning a 403 for teambuilding.com — probably bc cloudflare is blocking it — is there something i can whitelist." His account had no `products` row and `profiles.onboarding_completed = false` — he was stuck on step 1 of onboarding (entering his own site, teambuilding.com, to auto-fill product name/description).

Step 1 calls `POST /api/onboarding/fetch-site` (`apps/web/app/api/onboarding/fetch-site/route.ts`) → `fetchSiteDetails()` in `apps/web/lib/onboarding/fetch-site.ts:262-312`, which does exactly one plain `fetch()` (`fetchWithValidatedRedirects`, `fetch-site.ts:110-146`) with a hardcoded header set:

```ts
headers: {
  accept: "text/html,application/xhtml+xml",
  "user-agent": "Mozilla/5.0 (compatible; MentiohuntBot/0.1; +https://mentiohunt.com)",
},
```

No retry, no browser rendering, no proxy. On any non-2xx it throws (`fetch-site.ts:270`) and the wizard surfaces "Failed to reach your site" (`onboarding-wizard.tsx:204-209`), blocking onboarding entirely.

## Root cause

This endpoint runs on Vercel (`apps/web`, `runtime: "nodejs"`) and is completely separate from the Python scraper's fetch pipeline (`apps/scraper/core.py`) that the rest of the product uses for every other site fetch (backlink discovery, link tracking, the free tools). That pipeline has three escalating tiers — plain httpx, real Chromium, then a stealthy Camoufox browser with Cloudflare-challenge solving routed through a residential proxy (`core.py:143-196`, `STEALTHY_PROXY`) — specifically because a single plain request from a datacenter/cloud IP scores worse with Cloudflare's bot heuristics than diverse traffic. `fetch-site.ts` has none of that: it's the one plain, single-shot, no-fallback fetch left in the product's onboarding path, running from Vercel's shared serverless IP range (typically scored the same or worse than Railway's datacenter IP by Cloudflare bot-fight-mode-level rules).

**Confirmed teambuilding.com's block is shallow, not a hard IP block** — reproduced directly:
- Bare `curl` (default/no User-Agent) → 403, `Cf-Mitigated: challenge` header present (Cloudflare's own confirmation it issued a JS challenge, not a WAF deny).
- Same request with a realistic browser `User-Agent` + `Accept`/`Accept-Language` → clean 200, full page, no challenge.
- Same request with the *exact* `MentiohuntBot/0.1` UA this code sends → also a clean 200 from my test network.

**Confirmed the Python scraper pipeline is not at fault** — ran teambuilding.com through the actual production backlink-monitor path (`checkLink` → Railway scraper) live: `fetch_outcome=ok_light status=200`, resolved on the very first (plain httpx) tier, no escalation needed.

So the 403 Michael hit is consistent with Vercel's egress IP getting a worse bot score than other infra for that one request, with `fetch-site.ts` having zero mechanism to retry or recover — unlike every other fetch path in the product.

## Impact

Any prospect whose own site has even basic Cloudflare/WAF bot protection (bot-fight-mode tier, not a hard block) can get stuck at the very first step of onboarding with no way to proceed — before a `products` row even exists. Not a data-loss issue, but a hard onboarding blocker with a support-message-shaped failure mode: the user sees "Failed to reach your site" with no indication that it's a shallow, likely-transient bot check rather than a real block. Unknown how many signups have silently bounced here without messaging support first.

## Recommendation (not yet actioned)

- Cheapest fix: on a non-2xx/non-HTML failure, retry once with a realistic browser `User-Agent` + `Accept-Language` (proven sufficient for teambuilding.com-class protection, no proxy or JS rendering needed).
- More robust: route this fetch through the existing Railway scraper (`fetch_page`/`fetch_page_detailed`) instead of a bare Vercel-side fetch, so onboarding gets the same three-tier escalation (and residential proxy) as the rest of the product for free for this rare case.
- Either way, worth softening the failure message so a first-time 403 doesn't read as terminal — e.g. offer "try again" before blocking the flow.
