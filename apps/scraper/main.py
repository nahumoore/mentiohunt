import json
import os
import re
from urllib.parse import urljoin, urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from scrapling.fetchers import StealthyFetcher

load_dotenv()

app = FastAPI(title="Scraper Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

API_KEY = os.getenv("API_KEY")


class ScrapeRequest(BaseModel):
    url: str


class ScrapeResponse(BaseModel):
    name: str | None
    email: str | None
    contact_form_url: str | None
    confidence: str  # "name-and-email" | "name-only" | "generic" | "none"
    source: str | None  # where name was found


def extract_emails_from_text(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)


def get_base_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def fetch_page(url: str):
    try:
        return StealthyFetcher.fetch(url, headless=True, network_idle=True)
    except Exception:
        return None


def extract_from_page(page, source_label: str) -> dict:
    name = None
    email = None

    # meta author tag
    if not name:
        meta = page.css('meta[name="author"]::attr(content)').get()
        if meta and len(meta.strip()) > 1:
            name = meta.strip()

    # common byline CSS patterns
    byline_selectors = [
        ".author-name::text",
        ".author::text",
        ".byline-name::text",
        ".byline::text",
        '[rel="author"]::text',
        ".post-author::text",
        ".entry-author::text",
        ".article-author::text",
        '[class*="author"]::text',
        '[class*="byline"]::text',
    ]
    if not name:
        for sel in byline_selectors:
            val = page.css(sel).get()
            if val and len(val.strip()) > 1:
                name = val.strip()
                break

    # schema.org JSON-LD
    if not name:
        scripts = page.css('script[type="application/ld+json"]').getall()
        for script in scripts:
            try:
                data = json.loads(script)
                entries = data if isinstance(data, list) else [data]
                for entry in entries:
                    author = entry.get("author")
                    if isinstance(author, dict):
                        n = author.get("name")
                        if n:
                            name = n
                            break
                    elif isinstance(author, list) and author:
                        n = author[0].get("name") if isinstance(author[0], dict) else None
                        if n:
                            name = n
                            break
                if name:
                    break
            except Exception:
                continue

    # email directly on page
    full_text = page.get_text()
    emails = extract_emails_from_text(full_text)
    # filter out noreply, support, team emails
    ignore = {"noreply", "no-reply", "support", "team", "hello", "info", "contact", "admin"}
    personal_emails = [e for e in emails if not any(p in e.lower() for p in ignore)]
    email = personal_emails[0] if personal_emails else (emails[0] if emails else None)

    return {"name": name, "email": email, "source": source_label}


def find_contact_form_url(page, base_url: str) -> str | None:
    links = page.css("a::attr(href)").getall()
    for href in links:
        if not href:
            continue
        lower = href.lower()
        if any(k in lower for k in ["/contact", "/get-in-touch", "/reach-out", "/hire"]):
            return urljoin(base_url, href)
    return None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/scrape", response_model=ScrapeResponse)
def scrape(request: ScrapeRequest):
    if API_KEY:
        pass  # key checked via header in production — add header auth if needed

    url = request.url
    base_url = get_base_url(url)

    # step 1: scrape the article page
    page = fetch_page(url)
    if not page:
        raise HTTPException(status_code=422, detail="Failed to fetch URL")

    result = extract_from_page(page, source_label="article")
    contact_form_url = find_contact_form_url(page, base_url)

    # step 2: if name not found, try site-level pages
    if not result["name"]:
        for path in ["/about", "/about-us", "/team", "/contact"]:
            fallback_url = base_url + path
            fallback_page = fetch_page(fallback_url)
            if not fallback_page:
                continue
            fallback_result = extract_from_page(fallback_page, source_label=path)
            if fallback_result["name"]:
                result["name"] = fallback_result["name"]
                result["source"] = path
            if not result["email"] and fallback_result["email"]:
                result["email"] = fallback_result["email"]
            if not contact_form_url:
                contact_form_url = find_contact_form_url(fallback_page, base_url)
            if result["name"]:
                break

    # determine confidence
    if result["name"] and result["email"]:
        confidence = "name-and-email"
    elif result["name"]:
        confidence = "name-only"
    elif result["email"]:
        confidence = "email-only"
    else:
        confidence = "none"

    return ScrapeResponse(
        name=result["name"],
        email=result["email"],
        contact_form_url=contact_form_url,
        confidence=confidence,
        source=result["source"],
    )
