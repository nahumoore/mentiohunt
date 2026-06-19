# Runs an AI-assisted scrape on a URL to extract contact info (emails, socials, contact form).
# Guarded by a semaphore — only one scrape runs at a time to keep Playwright stable.

from fastapi import Depends
from fastapi.routing import APIRouter

from core import (
    AgentScrapeResponse,
    ScrapeRequest,
    _execution_log,
    _get_agent_helpers,
    _require_api_key,
    log,
    run_agent_scrape,
)

router = APIRouter()


@router.post("/agent-scrape", response_model=AgentScrapeResponse, dependencies=[Depends(_require_api_key)])
def agent_scrape(request: ScrapeRequest):
    with _execution_log("agent-scrape"):
        log.info(f"agent-scrape request: {request.url}")
        return run_agent_scrape(url=request.url, helpers=_get_agent_helpers())
