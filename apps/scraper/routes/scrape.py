# Runs an AI-assisted scrape on a URL to extract contact info (emails, socials, contact form).
# Guarded by a semaphore — only one scrape runs at a time to keep Playwright stable.

from fastapi import Depends, HTTPException
from fastapi.routing import APIRouter

from core import (
    AgentScrapeResponse,
    ScrapeRequest,
    _execution_log,
    _get_agent_helpers,
    _require_api_key,
    _scrape_semaphore,
    log,
    run_agent_scrape,
)

router = APIRouter()


@router.post("/agent-scrape", response_model=AgentScrapeResponse, dependencies=[Depends(_require_api_key)])
def agent_scrape(request: ScrapeRequest):
    if not _scrape_semaphore.acquire(blocking=False):
        log.warning("scraper busy, rejecting agent-scrape request")
        raise HTTPException(status_code=503, detail="Scraper busy, try again later")
    try:
        with _execution_log("agent-scrape"):
            log.info(f"agent-scrape request: {request.url}")
            return run_agent_scrape(url=request.url, helpers=_get_agent_helpers())
    finally:
        _scrape_semaphore.release()
