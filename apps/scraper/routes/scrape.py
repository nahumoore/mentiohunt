# Runs an AI-assisted scrape on a URL to extract contact info (emails, socials, contact form).

from fastapi import Depends, Request
from fastapi.routing import APIRouter
from pydantic import BaseModel

from core import (
    AgentScrapeResponse,
    CallerGone,
    QueueSaturated,
    ScrapeRequest,
    _clean_name,
    _dropped_slot_response,
    _execution_log,
    _extract_author_hints,
    _get_agent_helpers,
    _require_api_key,
    _scrape_slot,
    fetch_page,
    log,
    run_agent_scrape,
)

router = APIRouter()


@router.post("/agent-scrape", response_model=AgentScrapeResponse, dependencies=[Depends(_require_api_key)])
async def agent_scrape(request: ScrapeRequest, http_request: Request):
    with _execution_log("agent-scrape"):
        log.info(f"agent-scrape request: {request.url}")
        try:
            async with _scrape_slot("heavy", http_request):
                return await run_agent_scrape(url=request.url, helpers=_get_agent_helpers())
        except (QueueSaturated, CallerGone) as e:
            raise _dropped_slot_response(e)


class BylineScrapeResponse(BaseModel):
    name: str | None
    author_hints: list[str]
    author_url: str | None


@router.post("/byline-scrape", response_model=BylineScrapeResponse, dependencies=[Depends(_require_api_key)])
async def byline_scrape(request: ScrapeRequest, http_request: Request):
    """Single-page, no-LLM byline extraction — the cheap path for media/news sites
    where a full multi-page agent crawl isn't worth the cost (A6a)."""
    with _execution_log("byline-scrape"):
        log.info(f"byline-scrape request: {request.url}")
        try:
            async with _scrape_slot("light", http_request):
                page = await fetch_page(request.url)
        except (QueueSaturated, CallerGone) as e:
            raise _dropped_slot_response(e)
        if not page:
            return BylineScrapeResponse(name=None, author_hints=[], author_url=None)

        hints = _extract_author_hints(page)
        name = next((_clean_name(n) for n in hints["names"] if _clean_name(n)), None)
        return BylineScrapeResponse(
            name=name,
            author_hints=hints["names"],
            author_url=hints["urls"][0] if hints["urls"] else None,
        )
