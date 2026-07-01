Must fix

1. The venv was never actually upgraded — the app can't start. requirements.txt says scrapling[fetchers]>=0.4.8, but the installed package in apps/scraper/.venv is still 0.2.9 (pip show confirms). main.py:5 imports AsyncDynamicSession, AsyncStealthySession, which don't exist in 0.2.9, so the service dies at import time locally. Run:

apps/scraper/.venv/Scripts/pip install -U -r apps/scraper/requirements.txt
apps/scraper/.venv/Scripts/scrapling install --force

This also means I could only review the 0.4.x API usage against the docs, not against an installed copy — worth a smoke test of all three tiers after the upgrade.

2. The SSRF guard crashes the whole request from inside the agent loop. _ssrf_check raises HTTPException(400) on DNS failure or private-IP resolution, and fetch_page calls it outside any try block (core.py:280). When the route calls fetch_page, a 400 is reasonable. But when the agent tool calls it g catches it: one dead internal link — say atypo'd subdomain that passes _host_matches_target but doesn't resolve — propagates up through run_agent_scrape and turns an entire /check-mention request into a 400, discarding the already-computed qualification result. Catch exceptions around
fetch_page in _execute_scrape_page and return {" instead.

3. scrapling install in the Dockerfile needs --force. Per the Scrapling docs, non-interactive installs should use scrapling install --force — without it the build can hang or fail on the interactive prompt in Docker (Dockerfile:12).

Worth fixing

- _cf_blocked_domains compares unnormalized hostlparse(url).netloc (core.py:328), but the agent
checks domain in cf_blocked_domains with the seepy:204). If the challenge fired on example.comwhile the seed is www.example.com, the short-circuit misses. Run both through _normalize_host. Also note the set never expires and grows for the process lifetime — a transient challenge blocks the domain forever until restart.
- AGENT_BUDGET_SECONDS = 180 while its own comment says the caller times out at 120s. As written, the budget never saves the
caller — the response arrives after they've give's timeout (~100s) so partial data actually getsreturned. Also, the deadline is only checked between iterations, and one iteration can run 90s of LLM + 120s+ of tiered fetches, so real overshoot is large; checking the deadline before each scrape_page execution would tighten it.
- visited and internal_links use different URL forms, so a page can be scraped twice. visited stores the raw URL from the LLM
(agent_enrich.py:219) while internal links are n. If the agent fetched /about/ with a slash, thenormalized /about still appears in internal_links and passes the url in visited check. Store and compare _normalize_url(url) in visited/failed.
- Terminal statuses waste two browser fetches. A plain 404/410 from the light tier now escalates through dynamic and stealthy (up to ~2 minutes) before returning None. Dead URLs are common in mention checking; treat 404/410 as final at any tier and only escalate on block-ish signals (403, 429, 503, challenge pages, thin content).
- socket.getaddrinfo blocks the event loop. Routes are async now, and _ssrf_check does synchronous DNS in the event loop thread (core.py:121) — slow DNS stalls every concurrent request. Wrap it in asyncio.to_thread (and note the existing check is fetch-time-TOCTOU/redirect-blind anyway — acceptable given API-key gating, but don't treat it as a hard boundary).

Minor

- The word-boundary brand regex breaks for terms that start or end with non-word characters (\bc\+\+\b can never match) and
multi-word terms won't match across line breaks and terms are always plain words this is fine;otherwise replace inner whitespace with \s+ and skip \b next to non-word chars.
- The fallback LLM call (agent_enrich.py:371) is still unwrapped — if both models fail, the whole request 500s instead of returning the data gathered so far.
- Sessions live for the process lifetime with no recovery: if the Chromium/Camoufox process crashes mid-run, every subsequent browser fetch fails until restart. Scrapling sessions handle some of this internally, but a periodic health check or a restart-on-repeated-failure wrapper would make the escalation tiers self-healing.

The pattern across #1, #2, and the budget comment is that none of this has been exercised end-to-end yet — I'd upgrade thevenv, then run a live smoke test against one plain site, one JS-heavy site, and one Cloudflare-protected site before deploying.
