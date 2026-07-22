import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from scrapling.fetchers import AsyncDynamicSession, AsyncStealthySession

import core
from routes import check_mention_router, fetch_content_router, health_router, scrape_router


# Browser tab pools. The dynamic (Chromium) session is shared by BOTH concurrency
# pools' escalations (core.py): up to SCRAPE_HEAVY_CONCURRENCY heavy jobs plus any
# light fetches whose lightweight tier came back thin, so keep max_pages >= heavy
# capacity + a couple for light escalations. The stealthy (Camoufox) session only
# handles Cloudflare-challenged fetches; multiple tabs keep one CF solve from
# serializing every other protected fetch behind it. Sized for Railway Pro
# (usage-billed, no practical RAM cap) — the ceiling here is CPU contention
# inside the single Chromium instance, not memory.
_DYNAMIC_MAX_PAGES = int(os.getenv("DYNAMIC_MAX_PAGES", "12"))
_STEALTHY_MAX_PAGES = int(os.getenv("STEALTHY_MAX_PAGES", "3"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.getenv("API_KEY"):
        raise RuntimeError("API_KEY env var is not set — refusing to start without auth")

    async with AsyncDynamicSession(
        max_pages=_DYNAMIC_MAX_PAGES,
        headless=True,
        disable_resources=True,
        block_ads=True,
        timeout=60000,
    ) as dynamic_session:
        async with AsyncStealthySession(
            max_pages=_STEALTHY_MAX_PAGES,
            headless=True,
            solve_cloudflare=True,
            # Block WebRTC so a proxied fetch can't leak the Railway origin IP
            # around the proxy and undermine the residential appearance. Harmless
            # for the direct path. Per-request proxy is applied in core.fetch_page.
            block_webrtc=True,
            timeout=60000,
        ) as stealthy_session:
            core._dynamic_session = dynamic_session
            core._stealthy_session = stealthy_session
            yield


app = FastAPI(title="Scraper Service", lifespan=lifespan)

# No CORSMiddleware — this service is API-key gated and never called from a browser.

app.include_router(scrape_router)
app.include_router(check_mention_router)
app.include_router(fetch_content_router)
app.include_router(health_router)
