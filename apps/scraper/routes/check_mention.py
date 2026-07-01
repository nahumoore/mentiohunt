# Fetches a URL and checks whether it mentions the brand AND links to the target domain.
# If brand is mentioned but no link exists (unlinked mention), runs agent-scrape to enrich contact.
# Returns qualified=True only for unlinked brand mentions — the signal worth acting on.

import re

from fastapi import Depends
from fastapi.routing import APIRouter

from core import (
    CheckMentionRequest,
    CheckMentionResponse,
    _execution_log,
    _get_agent_helpers,
    _links_to_target,
    _require_api_key,
    _seeded_helpers,
    fetch_page,
    get_base_url,
    log,
    run_agent_scrape,
)

router = APIRouter()


@router.post("/check-mention", response_model=CheckMentionResponse, dependencies=[Depends(_require_api_key)])
async def check_mention(request: CheckMentionRequest):
    with _execution_log("check-mention"):
        log.info(f"check-mention request: {request.url} terms={request.brand_terms}")

        page = await fetch_page(request.url)
        if not page:
            return CheckMentionResponse(
                qualified=False, brand_present=False, links_to_target=[], reason="fetch_failed"
            )

        text = str(page.get_all_text()).lower()
        brand_present = any(
            bool(re.search(rf"\b{re.escape(term.strip().lower())}\b", text))
            for term in request.brand_terms
            if term.strip()
        )

        base_url = get_base_url(request.url)
        links = _links_to_target(page, base_url, request.target_domain)

        log.info(
            f"check-mention gate: url={request.url} brand_present={brand_present} "
            f"links_to_target={len(links)}"
        )

        if not brand_present:
            return CheckMentionResponse(
                qualified=False, brand_present=False, links_to_target=links, reason="no_brand_mention"
            )
        if links:
            return CheckMentionResponse(
                qualified=False, brand_present=True, links_to_target=links, reason="already_linked"
            )

        # Qualified unlinked mention — enrich contact reusing the fetched page as the agent seed.
        helpers = _seeded_helpers(request.url, page, _get_agent_helpers())
        contact = await run_agent_scrape(url=request.url, helpers=helpers)

        return CheckMentionResponse(
            qualified=True,
            brand_present=True,
            links_to_target=[],
            reason="unlinked_mention",
            contact=contact,
        )
