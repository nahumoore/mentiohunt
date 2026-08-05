import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from scrapling.engines.toolbelt import ProxyRotator
from scrapling.fetchers import AsyncDynamicSession, AsyncStealthySession

import core
from routes import check_link_router, check_mention_router, fetch_content_router, health_router, scrape_router


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


def _stealthy_session_kwargs() -> dict:
    kwargs = dict(
        max_pages=_STEALTHY_MAX_PAGES,
        headless=True,
        solve_cloudflare=True,
        # Block WebRTC so a proxied fetch can't leak the Railway origin IP
        # around the proxy and undermine the residential appearance. Harmless
        # for the direct path. Per-request proxy is applied in core.fetch_page.
        block_webrtc=True,
        timeout=60000,
    )
    if core._STEALTHY_PROXY is not None:
        # proxy_rotator just needs to be set (truthy) at session-start so
        # scrapling launches self.browser instead of a persistent context —
        # core.fetch_page always passes an explicit per-request proxy=, so
        # the rotator's own get_proxy() is never actually called.
        kwargs["proxy_rotator"] = ProxyRotator([core._STEALTHY_PROXY])
    return kwargs


async def _create_stealthy_session() -> AsyncStealthySession:
    """Build + start a fresh stealthy session. Registered on core as the
    restart factory so core._restart_stealthy_session_if_needed can replace
    the shared session in place after its browser context dies — see
    2026-07-22-stealthy-browser-context-crash.md. Not context-managed (no
    `async with`) because the instance this creates may not be the one still
    live at shutdown; lifespan below closes whichever is current instead."""
    session = AsyncStealthySession(**_stealthy_session_kwargs())
    await session.start()
    return session


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
        core._dynamic_session = dynamic_session
        core._stealthy_session_factory = _create_stealthy_session
        core._stealthy_session = await _create_stealthy_session()
        try:
            yield
        finally:
            # Close whichever session is current — a mid-run restart (core.py)
            # may have swapped this out from the one created above.
            await core._stealthy_session.close()


app = FastAPI(title="Scraper Service", lifespan=lifespan)

# No CORSMiddleware — this service is API-key gated and never called from a browser.

app.include_router(scrape_router)
app.include_router(check_mention_router)
app.include_router(fetch_content_router)
app.include_router(check_link_router)
app.include_router(health_router)
