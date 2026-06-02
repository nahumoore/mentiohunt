import json
import logging
import os
import re
import threading
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from scrapling.fetchers import PlayWrightFetcher

load_dotenv()

LOGS_DIR = Path(__file__).parent / ".logs"
LOGS_DIR.mkdir(exist_ok=True)

log_file = LOGS_DIR / f"scraper-{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H-%M-%S')}Z.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(log_file),
    ],
)
log = logging.getLogger("scraper")

fetcher = PlayWrightFetcher()

app = FastAPI(title="Scraper Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

API_KEY = os.getenv("API_KEY")


class _TextLinksExtractor(HTMLParser):
    """Flatten HTML to deduped text lines + markdown links. No tags emitted."""

    def __init__(self):
        super().__init__()
        self._parts: list[str] = []
        self._seen: set[str] = set()
        self._in_link = False
        self._current_href: str | None = None
        self._current_link_text: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self._in_link = True
            self._current_href = dict(attrs).get("href", "").strip() or None
            self._current_link_text = []

    def handle_endtag(self, tag):
        if tag == "a":
            self._in_link = False
            text = " ".join(self._current_link_text).strip()
            href = self._current_href
            entry = f"[{text}]({href})" if text and href else (href or text or None)
            self._emit(entry)
            self._current_href = None
            self._current_link_text = []

    def handle_data(self, data):
        text = data.strip()
        if not text:
            return
        if self._in_link:
            self._current_link_text.append(text)
        else:
            self._emit(text)

    def _emit(self, value: str | None) -> None:
        if value and value not in self._seen:
            self._seen.add(value)
            self._parts.append(value)

    def result(self) -> str:
        return "\n".join(self._parts)


def strip_html_attrs(raw: str) -> str:
    p = _TextLinksExtractor()
    p.feed(raw)
    return p.result()


class ScrapeRequest(BaseModel):
    url: str


class RawSnippets(BaseModel):
    header: str
    footer: str
    article_header: str


class ScrapeResponse(BaseModel):
    name: str | None
    email: str | None
    contact_form_url: str | None
    confidence: str  # "name-and-email" | "name-only" | "generic" | "none"
    source: str | None  # where name was found
    social_links: dict[str, str]  # platform -> url
    raw_snippets: RawSnippets | None = None


def extract_emails_from_text(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)


SOCIAL_DOMAINS = {
    "linkedin": "linkedin.com/in/",
    "twitter": ("twitter.com/", "x.com/"),
    "instagram": "instagram.com/",
    "youtube": ("youtube.com/@", "youtube.com/c/", "youtube.com/user/"),
    "facebook": "facebook.com/",
}

SOCIAL_SKIP_FRAGMENTS = {"intent", "share", "home", "sharer", "search"}


def extract_social_links(page) -> dict[str, str]:
    found: dict[str, str] = {}
    for el in page.css("a"):
        href = el.attrib.get("href", "").strip()
        if not href or not href.startswith("http"):
            continue
        lower = href.lower()
        for platform, patterns in SOCIAL_DOMAINS.items():
            if platform in found:
                continue
            checks = (patterns,) if isinstance(patterns, str) else patterns
            for fragment in checks:
                if fragment in lower:
                    path = lower.split(fragment, 1)[1].split("/")[0].split("?")[0]
                    if path and path not in SOCIAL_SKIP_FRAGMENTS:
                        found[platform] = href.rstrip("/").replace("%20", "").rstrip("/")
                    break
    return found


def get_base_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def fetch_page(url: str):
    try:
        log.info(f"fetching {url}")
        page = fetcher.fetch(url, headless=True, network_idle=False, stealth=True, timeout=60000)
        log.info(f"fetched ok {url} status={page.status}")
        return page
    except Exception as e:
        log.error(f"fetch failed {url}: {e}")
        return None


def _css_first_text(page, selector: str) -> str | None:
    el = page.css_first(selector)
    if not el:
        return None
    t = str(el.text or "").strip()
    return t if len(t) > 1 else None


def _css_first_attr(page, selector: str, attr: str) -> str | None:
    el = page.css_first(selector)
    if not el:
        return None
    val = el.attrib.get(attr, "")
    return val.strip() if val and len(val.strip()) > 1 else None


def _looks_like_person(name: str, domain: str = "") -> bool:
    """Return False for brand names, handles, or names that spell out the domain."""
    if not name or name.startswith("@"):
        return False
    # reject if name normalizes to the domain (e.g. "Traffic Think Tank" → trafficthinktank)
    if domain:
        name_slug = re.sub(r"[^a-z0-9]", "", name.lower())
        domain_core = re.sub(r"[^a-z0-9]", "", domain.lower().split(".")[0])
        if name_slug == domain_core or domain_core in name_slug:
            return False
    return True


def extract_from_page(page, source_label: str, domain: str = "") -> dict:
    name = None
    email = None

    # meta tags
    for meta_sel, meta_attr in [
        ('meta[name="author"]', "content"),
        ('meta[property="article:author"]', "content"),
    ]:
        if not name:
            val = _css_first_attr(page, meta_sel, meta_attr)
            if _looks_like_person(val, domain):
                name = val

    # HTML microdata
    if not name:
        val = _css_first_attr(page, '[itemprop="author"]', "content") or \
              _css_first_text(page, '[itemprop="author"]')
        if _looks_like_person(val, domain):
            name = val

    # common byline CSS patterns
    byline_selectors = [
        ".author-name", ".author", ".byline-name", ".byline",
        '[rel="author"]', ".post-author", ".entry-author",
        ".article-author", ".written-by", ".author-box__name",
        ".post-meta .name", ".entry-meta .author",
        # article-scoped (byline inside article/main, not page header)
        "article .author", "article [class*='author']",
        "main [class*='author']",
        ".entry-header [class*='author']",
        # WordPress Gutenberg
        ".wp-block-post-author__name",
        # generic class fragments last
        '[class*="author"]', '[class*="byline"]',
    ]
    if not name:
        for sel in byline_selectors:
            val = _css_first_text(page, sel)
            if _looks_like_person(val, domain):
                name = val
                break

    # schema.org JSON-LD
    if not name:
        for script_el in page.css('script[type="application/ld+json"]'):
            try:
                data = json.loads(str(script_el.text or ""))
                entries = data if isinstance(data, list) else [data]
                for entry in entries:
                    author = entry.get("author")
                    if isinstance(author, dict):
                        n = author.get("name")
                        if _looks_like_person(n, domain):
                            name = n
                            break
                    elif isinstance(author, list) and author:
                        n = author[0].get("name") if isinstance(author[0], dict) else None
                        if _looks_like_person(n, domain):
                            name = n
                            break
                if name:
                    break
            except Exception:
                continue

    # scan ALL <header> elements — pages often have nav header + article header
    if not name:
        header_selectors = [
            ".name", "[class*='name']", "span", "a",
        ]
        for header_el in page.css("header"):
            for sel in header_selectors:
                for el in header_el.css(sel):
                    val = str(el.text or "").strip()
                    if val and 1 < len(val) < 60 and "\n" not in val and _looks_like_person(val, domain):
                        name = val
                        break
                if name:
                    break
            if name:
                break

    # "By Name" text pattern — try each <header> first, then full page
    if not name:
        _by_pattern = re.compile(r"\bBy\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)")
        for header_el in page.css("header"):
            m = _by_pattern.search(str(header_el.get_all_text() if hasattr(header_el, "get_all_text") else header_el.text or ""))
            if m and _looks_like_person(m.group(1), domain):
                name = m.group(1)
                break
    if not name:
        m = _by_pattern.search(str(page.get_all_text()))
        if m and _looks_like_person(m.group(1), domain):
            name = m.group(1)

    # email directly on page
    full_text = str(page.get_all_text())
    emails = extract_emails_from_text(full_text)
    ignore = {"noreply", "no-reply", "support", "team", "hello", "info", "contact", "admin"}
    personal_emails = [e for e in emails if not any(p in e.lower() for p in ignore)]
    email = personal_emails[0] if personal_emails else (emails[0] if emails else None)

    return {"name": name, "email": email, "source": source_label}


GENERIC_EMAIL_PREFIXES = {"noreply", "no-reply", "support", "team", "hello", "info", "contact", "admin"}


def is_personal_email(email: str | None) -> bool:
    if not email:
        return False
    prefix = email.split("@")[0].lower()
    return not any(p in prefix for p in GENERIC_EMAIL_PREFIXES)


def find_contact_form_url(page, base_url: str) -> str | None:
    links = [el.attrib.get("href", "") for el in page.css("a")]
    for href in links:
        if not href:
            continue
        lower = href.lower()
        if any(k in lower for k in ["/contact", "/get-in-touch", "/reach-out", "/hire"]):
            return urljoin(base_url, href)
    return None


def find_author_profile_url(page, base_url: str, name: str | None = None) -> str | None:
    # 1. JSON-LD author.url
    for script_el in page.css('script[type="application/ld+json"]'):
        try:
            data = json.loads(str(script_el.text or ""))
            entries = data if isinstance(data, list) else [data]
            for entry in entries:
                author = entry.get("author")
                candidates = author if isinstance(author, list) else ([author] if isinstance(author, dict) else [])
                for a in candidates:
                    url = a.get("url") or a.get("sameAs")
                    if not url or not isinstance(url, str):
                        continue
                    full = urljoin(base_url, url)
                    if urlparse(full).netloc == urlparse(base_url).netloc:
                        return full
        except Exception:
            continue

    # 2. Anchor elements with author-related selectors
    author_link_selectors = [
        'a[rel="author"]',
        ".author-name a",
        ".author a",
        ".byline-name a",
        ".byline a",
        ".post-author a",
        ".entry-author a",
        ".article-author a",
        '[class*="author"] a',
        '[class*="byline"] a',
    ]
    for sel in author_link_selectors:
        el = page.css_first(sel)
        if not el:
            continue
        href = el.attrib.get("href", "").strip()
        if not href or href.startswith("mailto:") or href.startswith("#"):
            continue
        full = urljoin(base_url, href)
        if urlparse(full).netloc == urlparse(base_url).netloc:
            return full

    # 3. Guess /author/<name-slug>/ from extracted name
    if name:
        slug = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")
        if slug:
            return f"{base_url}/author/{slug}/"

    return None


_scrape_semaphore = threading.Semaphore(1)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/scrape", response_model=ScrapeResponse)
def scrape(request: ScrapeRequest):
    if not _scrape_semaphore.acquire(blocking=False):
        log.warning("scraper busy, rejecting request")
        raise HTTPException(status_code=503, detail="Scraper busy, try again later")

    try:
        url = request.url
        base_url = get_base_url(url)
        log.info(f"scrape request: {url}")

        page = fetch_page(url)
        if not page:
            log.warning(f"step1 failed, cannot fetch: {url}")
            raise HTTPException(status_code=422, detail="Failed to fetch URL")

        result = extract_from_page(page, source_label="article", domain=base_url)
        contact_form_url = find_contact_form_url(page, base_url)
        author_profile_url = find_author_profile_url(page, base_url, name=result["name"])
        social_links = extract_social_links(page)
        log.info(f"step1 result: name={result['name']} email={result['email']} source={result['source']} author_profile={author_profile_url} social={social_links}")

        # Follow author profile link — higher chance of personal email than generic fallbacks
        if author_profile_url and not is_personal_email(result["email"]):
            author_page = fetch_page(author_profile_url)
            if author_page:
                author_result = extract_from_page(author_page, source_label="author-profile", domain=base_url)
                author_social = extract_social_links(author_page)
                social_links = {**social_links, **author_social}
                log.info(f"author profile: name={author_result['name']} email={author_result['email']} social={author_social}")
                if not result["name"] and author_result["name"]:
                    result["name"] = author_result["name"]
                    result["source"] = "author-profile"
                if author_result["email"]:
                    result["email"] = author_result["email"]
                if not contact_form_url:
                    contact_form_url = find_contact_form_url(author_page, base_url)

        if not result["name"]:
            for path in ["/about", "/about-us", "/team", "/contact"]:
                fallback_url = base_url + path
                fallback_page = fetch_page(fallback_url)
                if not fallback_page:
                    continue
                fallback_result = extract_from_page(fallback_page, source_label=path, domain=base_url)
                log.info(f"fallback {path}: name={fallback_result['name']} email={fallback_result['email']}")
                if fallback_result["name"]:
                    result["name"] = fallback_result["name"]
                    result["source"] = path
                if not result["email"] and fallback_result["email"]:
                    result["email"] = fallback_result["email"]
                if not contact_form_url:
                    contact_form_url = find_contact_form_url(fallback_page, base_url)
                if result["name"]:
                    break

        if result["name"] and result["email"]:
            confidence = "name-and-email"
        elif result["name"]:
            confidence = "name-only"
        elif result["email"]:
            confidence = "email-only"
        else:
            confidence = "none"

        log.info(f"done: name={result['name']} email={result['email']} confidence={confidence} source={result['source']} social={social_links}")

        def _first_el(page, *selectors):
            for sel in selectors:
                el = page.css_first(sel)
                if el:
                    return el
            return None

        def _all_els(page, *selectors):
            for sel in selectors:
                els = page.css(sel)
                if els:
                    return els
            return []

        all_headers = _all_els(page, "header", '[role="banner"]', '[id*="header"]', '[class*="site-header"]', '[class*="page-header"]')
        footer_el = _first_el(page, "footer", '[role="contentinfo"]', '[id*="footer"]', '[class*="site-footer"]', '[class*="page-footer"]')
        article_header_el = _first_el(page, "article header", "main header", ".entry-header", ".post-header", '[class*="article-header"]', '[class*="post-header"]')
        raw_snippets = RawSnippets(
            header="\n".join(strip_html_attrs(h.html_content or "") for h in all_headers),
            footer=strip_html_attrs(footer_el.html_content or "") if footer_el else "",
            article_header=strip_html_attrs(article_header_el.html_content or "") if article_header_el else "",
        )

        return ScrapeResponse(
            name=result["name"],
            email=result["email"],
            contact_form_url=contact_form_url,
            confidence=confidence,
            source=result["source"],
            social_links=social_links,
            raw_snippets=raw_snippets,
        )
    finally:
        _scrape_semaphore.release()
