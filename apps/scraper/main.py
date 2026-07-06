import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from scrapling.fetchers import AsyncDynamicSession, AsyncStealthySession

import core
from routes import check_mention_router, fetch_content_router, health_router, scrape_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.getenv("API_KEY"):
        raise RuntimeError("API_KEY env var is not set — refusing to start without auth")

    async with AsyncDynamicSession(
        max_pages=3,
        headless=True,
        disable_resources=True,
        block_ads=True,
        timeout=60000,
    ) as dynamic_session:
        async with AsyncStealthySession(
            max_pages=1,
            headless=True,
            solve_cloudflare=True,
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
