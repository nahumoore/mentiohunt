# Runs an AI-assisted scrape on a URL to extract contact info (emails, socials, contact form).

from fastapi import Depends
from fastapi.routing import APIRouter
from pydantic import BaseModel

from core import (
    AgentScrapeResponse,
    ScrapeRequest,
    _clean_name,
    _execution_log,
    _extract_author_hints,
    _get_agent_helpers,
    _require_api_key,
    fetch_page,
    log,
    run_agent_scrape,
)

router = APIRouter()


@router.post("/agent-scrape", response_model=AgentScrapeResponse, dependencies=[Depends(_require_api_key)])
async def agent_scrape(request: ScrapeRequest):
    with _execution_log("agent-scrape"):
        log.info(f"agent-scrape request: {request.url}")
        return await run_agent_scrape(url=request.url, helpers=_get_agent_helpers())


class BylineScrapeResponse(BaseModel):
    name: str | None
    author_hints: list[str]
    author_url: str | None


@router.post("/byline-scrape", response_model=BylineScrapeResponse, dependencies=[Depends(_require_api_key)])
async def byline_scrape(request: ScrapeRequest):
    """Single-page, no-LLM byline extraction — the cheap path for media/news sites
    where a full multi-page agent crawl isn't worth the cost (A6a)."""
    with _execution_log("byline-scrape"):
        log.info(f"byline-scrape request: {request.url}")
        page = await fetch_page(request.url)
        if not page:
            return BylineScrapeResponse(name=None, author_hints=[], author_url=None)

        hints = _extract_author_hints(page)
        name = next((_clean_name(n) for n in hints["names"] if _clean_name(n)), None)
        return BylineScrapeResponse(
            name=name,
            author_hints=hints["names"],
            author_url=hints["urls"][0] if hints["urls"] else None,
        )
