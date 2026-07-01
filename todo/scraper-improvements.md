The service is well-structured (tiered fetching, seeded agent, sanitization of LLM output are all good ideas), but there are two confirmed production bugs — a timeout that's effectively 4 hours instead of 15 seconds, and a stealth tier that can't work in Docker at all — plus you're on Scrapling 0.2.9, three minor versions behind an API that would remove your biggest performance bottleneck (browser launch per request).

Confirmed bugs

1. timeout=15000 on the light fetcher is 15,000 seconds, not milliseconds — core.py:192. I checked the installed 0.2.9 source: Fetcher.get(url, timeout=...) is httpx-based and documented as "time to wait for the request to finish in seconds. The default is 10". Browser fetchers use milliseconds, the HTTP fetcher uses seconds — the code copied the ms convention. A hanging or slow-dripping server holds a threadpool worker for up to ~4.2 hours per request. It should be timeout=15.

2. The stealthy tier is dead in Docker — Dockerfile:12-13 installs Playwright Chromium and rebrowser Chromium, but StealthyFetcher in 0.2.9 runs Camoufox (Firefox-based), whose browser binary must be downloaded separately (python -m camoufox fetch). The pip package is installed, the browser isn't. So in production the final escalation tier in fetch_page always throws, and every Cloudflare/anti-bot site silently returns fetch_failed. Add RUN python -m camoufox fetch (or migrate to 0.4.x where scrapling install handles all browsers).

3. HTTP status is never checked — fetch_page (core.py:189-220) only checks text length ≥ 500 chars. Scrapling's response exposes .status, but a 404, 410, or a wordy 403 block page with enough text passes as a successful fetch. For check-mention this is a correctness issue: a deleted article (404 with a chatty error page) that happens to still contain the brand name in boilerplate would be reported as a qualified unlinked mention. Check page.status and escalate/fail on non-2xx.

4. Brand matching is raw substring matching — ch().lower() in text means a brand term like"mentio" matches "mentioned", "attentio n"…, and short brands or brands that are dictionary words will produce false-positive qualified mentions — the exact signal the product sells. Use word-boundary regex (\b with re.escape) per term.
5. Agent domain check breaks on www/non-www — agurlparse(url).netloc != domain. You already have_normalize_host/\_host_matches_target in core.py:260-268 but don't use them here. If the seed URL is https://www.example.com/post, the LLM proposing https://example.com/about gets "URL must be on www.example.com" — and the internal-links filter at agent_enrich.py:223 drops those links too, so on sites that mix www and bare-domain links the agent can be unable to navigate at all.

6. Failed tool calls burn the page budget — agent_enrich.py:367-374: pages_scraped += 1 runs even when \_execute_scrape_page returned an error (blocked external URL, already-visited, fetch failure). And since failed fetches are not added to visited, the model can retry the same broken URL repeatedly, spending the whole MAX_PAGES budget on nothing. Only count successful scrapes; add failed URLs to a "don't retry" set.  

7. \_execution_log interleaves concurrent requests — core.py:34-44 attaches a FileHandler to the single shared scraper logger. Two overlapping requests write each other's lines into both files, and second-resolution timestamps in the filename cacollide (the second handler appends to the firstis serialized, misleading the moment it isn't.Also nothing ever prunes .logs/ — one file per request grows unbounded in the container.

Biggest improvement: migrate to Scrapling 0.4.x and use sessions

You're on 0.2.9; current is 0.4.8+. Beyond bugfixes, the API changed in ways that directly address this service's design:

- PlayWrightFetcher → DynamicFetcher, and one-ofar down a full browser per request. That's whyyou need \_browser_semaphore(1) — total serialization of every browser fetch behind ~1–3s of Chromium startup each time. 0.4.x DynamicSession / StealthySession keep a browser alive with a tab pool (max_pages=N), giving you safe concurrency and removing the startup cost. For a service whose agent fetches up to 6 pages per request, this is the single largest latency win available.
- solve_cloudflare=True on the stealthy session llenges rather than just fingerprint-masking.
- scrapling install sets up all browser deps in one step — fixes the Dockerfile fragility from bug #2.
- disable_resources=True on your dynamic tier is good; 0.4.x also adds block_ads to cut noise further.

The migration is mechanical for your usage surfarst, .attrib, get_all_text, html_content allsurvive), but do it deliberately — pin scrapling[fetchers]>=0.4.8 and smoke-test the three tiers.

Smaller improvements

- No SSRF guard: the service fetches any URL callers send, including http://169.254.169.254/ or internal hosts. It's API-key gated so exposure is limited, but if API_KEY is unset the guard in core.py:57 silently disables auth entirely — I'd fail fast at startup instead. (Note Scrapling 0.4's CLI defaults to rejecting redirects to private IPs; your version does nothing.)
- \_is_personal is dead code (agent_enrich.py:130): you trust the LLM's personal/general classification in finish, while a
  deterministic classifier sits unused. Use it to ype — confidence: "personalized" drives outreach
  decisions, so don't let the model self-grade it.
- Seeded-page cache misses on trivial URL differences (core.py:294): url == seed_url is exact-string, and the first URL the agent fetches comes from the LLM, which often normalizes trailing slashes — a miss means re-fetching the page you already have. Compare normalized URLs.
- mailto-extracted emails skip the placeholder f1) and dedupe case-sensitively, unlike
  extract_emails_from_text.
- No overall deadline on /check-mention: worst case is a serialized chain of tiered fetches (60s+60s each) × 6 agent pages × LLM calls with 90s timeouts — the caller has long since timed out but the worker keeps grinding. Add a wall-clock budget to the agent loop.
- Internal-link normalization strips query strinch makes sites using ?page_id= navigation (old
  WordPress) invisible to the agent.
- social_links from the LLM's finish are returned unvalidated — everything else (name, emails) is sanitized, but a hallucinated LinkedIn URL flows straight to outreach. Cross-check against links actually seen by extract_social_links during the crawl.
- CORSMiddleware with allow_origins=["*"] on a seight — no browser calls this; you can drop it.
