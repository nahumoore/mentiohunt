# Returns structured page content (title, description, text) using the tiered fetcher.
# Lightweight httpx first; escalates to dynamic session if content is thin.

from fastapi import Depends, HTTPException, Request
from fastapi.routing import APIRouter
from pydantic import BaseModel

from core import (
    CallerGone,
    QueueSaturated,
    ScrapeRequest,
    _dropped_slot_response,
    _execution_log,
    _require_api_key,
    _scrape_slot,
    fetch_page,
    log,
)

router = APIRouter()

TEXT_CHAR_LIMIT = 4_000


class FetchContentResponse(BaseModel):
    url: str
    title: str
    description: str
    text: str


def _extract_content(page, url: str) -> FetchContentResponse:
    title_el = page.css("title").first
    title = str(title_el.text).strip() if title_el else ""

    desc_el = page.css('meta[name="description"]').first or page.css(
        'meta[property="og:description"]'
    ).first
    description = (desc_el.attrib.get("content") or "").strip() if desc_el else ""

    text = str(page.get_all_text()).strip()[:TEXT_CHAR_LIMIT]

    return FetchContentResponse(url=url, title=title, description=description, text=text)


@router.post("/fetch-content", response_model=FetchContentResponse, dependencies=[Depends(_require_api_key)])
async def fetch_content(request: ScrapeRequest, http_request: Request):
    with _execution_log("fetch-content"):
        log.info(f"fetch-content request: {request.url}")
        try:
            async with _scrape_slot("light", http_request):
                page = await fetch_page(request.url)
        except (QueueSaturated, CallerGone) as e:
            raise _dropped_slot_response(e)
        if not page:
            raise HTTPException(status_code=502, detail="fetch failed")
        return _extract_content(page, request.url)
