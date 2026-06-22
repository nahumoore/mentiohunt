import logging
import os
import re
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

from dotenv import load_dotenv
from fastapi import HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from scrapling.fetchers import Fetcher, PlayWrightFetcher, StealthyFetcher

from agent_enrich import AgentScrapeResponse, run_agent_scrape

load_dotenv()

LOGS_DIR = Path(__file__).parent / ".logs"
LOGS_DIR.mkdir(exist_ok=True)

_LOG_FORMAT = logging.Formatter("%(asctime)s %(levelname)s %(message)s")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler()],
)
log = logging.getLogger("scraper")


@contextmanager
def _execution_log(route: str):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    handler = logging.FileHandler(LOGS_DIR / f"{route}-{ts}.log")
    handler.setFormatter(_LOG_FORMAT)
    log.addHandler(handler)
    try:
        yield
    finally:
        log.removeHandler(handler)
        handler.close()


_light_fetcher = Fetcher()
_dynamic_fetcher = PlayWrightFetcher()
_browser_semaphore = threading.Semaphore(1)

API_KEY = os.getenv("API_KEY")
_api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)


def _require_api_key(key: str | None = Security(_api_key_header)):
    if API_KEY and key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


class _TextLinksExtractor(HTMLParser):
    """Flatten HTML to deduped text lines + markdown links. No tags emitted."""

    _SKIP_TAGS = {"script", "style", "noscript", "svg", "path"}

    def __init__(self):
        super().__init__()
        self._parts: list[str] = []
        self._seen: set[str] = set()
        self._in_link = False
        self._current_href: str | None = None
        self._current_link_text: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self._SKIP_TAGS:
            self._skip_depth += 1
            return
        if self._skip_depth:
            return
        if tag == "a":
            self._in_link = True
            self._current_href = dict(attrs).get("href", "").strip() or None
            self._current_link_text = []

    def handle_endtag(self, tag):
        if tag in self._SKIP_TAGS:
            self._skip_depth = max(0, self._skip_depth - 1)
            return
        if self._skip_depth:
            return
        if tag == "a":
            self._in_link = False
            text = " ".join(self._current_link_text).strip()
            href = self._current_href
            entry = f"[{text}]({href})" if text and href else (href or text or None)
            self._emit(entry)
            self._current_href = None
            self._current_link_text = []

    def handle_data(self, data):
        if self._skip_depth:
            return
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


class CheckMentionRequest(BaseModel):
    url: str
    brand_terms: list[str]
    target_domain: str


class CheckMentionResponse(BaseModel):
    qualified: bool
    brand_present: bool
    links_to_target: list[str]
    reason: str
    contact: AgentScrapeResponse | None = None


_PLACEHOLDER_EMAIL_DOMAINS_CORE = {"example.com", "example.org", "example.net", "test.com", "domain.com", "email.com", "yourdomain.com", "sample.com", "acme.com", "placeholder.com", "fakeemail.com"}


def extract_emails_from_text(text: str) -> list[str]:
    found = re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    return [e for e in found if e.rsplit("@", 1)[-1].lower() not in _PLACEHOLDER_EMAIL_DOMAINS_CORE]


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
        log.info(f"fetching lightweight {url}")
        page = _light_fetcher.get(url, timeout=15000, stealthy_headers=True)
        text = str(page.get_all_text()).strip()
        if len(text) >= 500:
            log.info(f"fetched ok (light) {url}")
            return page
        log.info(f"light fetch thin content ({len(text)} chars), escalating to playwright {url}")
    except Exception as e:
        log.warning(f"light fetch failed {url}: {e}, escalating to playwright")

    with _browser_semaphore:
        try:
            log.info(f"fetching playwright {url}")
            page = _dynamic_fetcher.fetch(url, headless=True, disable_resources=True, timeout=60000)
            text = str(page.get_all_text()).strip()
            if len(text) >= 500:
                log.info(f"fetched ok (playwright) {url}")
                return page
            log.info(f"playwright fetch thin content ({len(text)} chars), escalating to stealthy {url}")
        except Exception as e:
            log.warning(f"playwright fetch failed {url}: {e}, escalating to stealthy")

        try:
            log.info(f"fetching stealthy {url}")
            page = StealthyFetcher.fetch(url, headless=True, disable_resources=True, timeout=60000)
            log.info(f"fetched ok (stealthy) {url}")
            return page
        except Exception as e:
            log.error(f"stealthy fetch failed {url}: {e}")
            return None


def find_contact_form_url(page, base_url: str) -> str | None:
    links = [el.attrib.get("href", "") for el in page.css("a")]
    for href in links:
        if not href:
            continue
        lower = href.lower()
        if any(k in lower for k in ["/contact", "/get-in-touch", "/reach-out", "/hire"]):
            return urljoin(base_url, href)
    return None


def _first_el(page, *selectors):
    for sel in selectors:
        el = page.css_first(sel)
        if el:
            return el
    return None


_AGENT_HELPERS = None


def _get_agent_helpers() -> dict:
    global _AGENT_HELPERS
    if _AGENT_HELPERS is None:
        _AGENT_HELPERS = {
            "fetch_page": fetch_page,
            "extract_social_links": extract_social_links,
            "extract_emails_from_text": extract_emails_from_text,
            "get_base_url": get_base_url,
            "strip_html_attrs": strip_html_attrs,
            "_first_el": _first_el,
            "find_contact_form_url": find_contact_form_url,
        }
    return _AGENT_HELPERS


def _normalize_host(host: str) -> str:
    host = host.lower().strip().lstrip(".")
    return host[4:] if host.startswith("www.") else host


def _host_matches_target(host: str, target: str) -> bool:
    host = _normalize_host(host)
    target = _normalize_host(target)
    return bool(host) and (host == target or host.endswith("." + target))


def _links_to_target(page, base_url: str, target_domain: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for el in page.css("a[href]"):
        href = el.attrib.get("href", "").strip()
        if not href or href.startswith(("mailto:", "tel:", "#", "javascript:")):
            continue
        full = urljoin(base_url, href)
        try:
            host = urlparse(full).netloc
        except Exception:
            continue
        if host and _host_matches_target(host, target_domain) and full not in seen:
            seen.add(full)
            found.append(full)
    return found


def _seeded_helpers(seed_url: str, seed_page, helpers: dict) -> dict:
    """Reuse the already-fetched seed page so the contact agent doesn't re-fetch it."""
    real_fetch = helpers["fetch_page"]
    state = {"used": False}

    def cached_fetch(url: str):
        if not state["used"] and url == seed_url:
            state["used"] = True
            return seed_page
        return real_fetch(url)

    return {**helpers, "fetch_page": cached_fetch}


__all__ = [
    "log",
    "_execution_log",
    "_require_api_key",
    "_get_agent_helpers",
    "_seeded_helpers",
    "_links_to_target",
    "fetch_page",
    "get_base_url",
    "ScrapeRequest",
    "CheckMentionRequest",
    "CheckMentionResponse",
    "AgentScrapeResponse",
    "run_agent_scrape",
]
