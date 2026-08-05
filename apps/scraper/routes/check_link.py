# Checks whether a page still contains a backlink to a given target domain —
# the core primitive behind the daily Link Tracker sweep in apps/server.
# Returns enough detail (outcome, status, every matching anchor's rel/anchor
# text, and any competitor-domain anchors found) for the Node side to diff
# against what it observed on the previous check without re-fetching anything.

from fastapi import Depends
from fastapi.routing import APIRouter
from pydantic import BaseModel, Field

from core import (
    _anchors_to_target,
    _execution_log,
    _require_api_key,
    _scrape_slot,
    fetch_page_detailed,
    get_base_url,
    log,
)

router = APIRouter()


class CheckLinkRequest(BaseModel):
    url: str
    target_domain: str
    competitor_domains: list[str] = Field(default_factory=list)
    # Skip the light (httpx) tier and start at Chromium — used by the
    # afternoon confirmation pass, since some sites render their link list
    # client-side and a thin-but-real light-tier response would otherwise
    # read as "link gone" a day early.
    force_dynamic: bool = False


class LinkAnchor(BaseModel):
    href: str
    rel_tokens: list[str]
    anchor_text: str
    is_dofollow: bool
    is_image_link: bool


class CompetitorLink(BaseModel):
    domain: str
    href: str
    anchor_text: str


class CheckLinkResponse(BaseModel):
    outcome: str  # "ok" | "dead" | "http_error" | "cf_blocked" | "fetch_failed"
    status_code: int | None
    final_url: str | None
    redirected: bool
    total_links: int
    target_links: list[LinkAnchor]
    competitor_links: list[CompetitorLink]


@router.post("/check-link", response_model=CheckLinkResponse, dependencies=[Depends(_require_api_key)])
async def check_link(request: CheckLinkRequest):
    with _execution_log("check-link"):
        log.info(
            f"check-link request: {request.url} target={request.target_domain} "
            f"force_dynamic={request.force_dynamic}"
        )
        async with _scrape_slot("light"):
            result = await fetch_page_detailed(request.url, force_dynamic=request.force_dynamic)

        if result.page is None:
            return CheckLinkResponse(
                outcome=result.outcome,
                status_code=result.status_code,
                final_url=result.final_url,
                redirected=False,
                total_links=0,
                target_links=[],
                competitor_links=[],
            )

        final_url = result.final_url or request.url
        # Resolve relative hrefs against the post-redirect URL, not the
        # requested one — a page that redirected from /old-post to /post would
        # otherwise resolve its own relative links against the wrong base.
        base_url = get_base_url(final_url)

        target_links = [
            LinkAnchor(**anchor)
            for anchor in _anchors_to_target(result.page, base_url, request.target_domain)
        ]

        competitor_links: list[CompetitorLink] = []
        for domain in request.competitor_domains:
            for anchor in _anchors_to_target(result.page, base_url, domain):
                competitor_links.append(
                    CompetitorLink(domain=domain, href=anchor["href"], anchor_text=anchor["anchor_text"])
                )

        return CheckLinkResponse(
            outcome=result.outcome,
            status_code=result.status_code,
            final_url=result.final_url,
            redirected=bool(result.final_url) and result.final_url != request.url,
            total_links=len(result.page.css("a[href]")),
            target_links=target_links,
            competitor_links=competitor_links,
        )
