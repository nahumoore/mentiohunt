import asyncio
import contextvars
import ipaddress
import logging
import logging.handlers
import os
import re
import socket
import uuid
from contextlib import asynccontextmanager, contextmanager
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

from dotenv import load_dotenv
from fastapi import HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from scrapling.fetchers import Fetcher

from agent_enrich import AgentScrapeResponse, _clean_name, _extract_author_hints, run_agent_scrape

load_dotenv()

LOGS_DIR = Path(__file__).parent / ".logs"
LOGS_DIR.mkdir(exist_ok=True)

# --- Logging setup -----------------------------------------------------------
# request_id contextvar: set per request so concurrent log lines are attributable
# even though they all go to a single rotating file + stdout.
_request_id: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")

_SCRAPER_LOG_FORMAT = logging.Formatter("%(asctime)s %(levelname)s [%(request_id)s] %(message)s")


class _RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = _request_id.get("-")  # type: ignore[attr-defined]
        return True


# Root logger: plain format — other libs (uvicorn, starlette) log here and
# don't have request_id; using it in the root format causes KeyError.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler()],
)

# scraper logger: own handlers with request_id; don't propagate to root to
# avoid double-logging every scraper line.
log = logging.getLogger("scraper")
log.propagate = False
log.setLevel(logging.INFO)

_stdout_handler = logging.StreamHandler()
_stdout_handler.setFormatter(_SCRAPER_LOG_FORMAT)
_stdout_handler.addFilter(_RequestIdFilter())
log.addHandler(_stdout_handler)

# Rotating file handler — single shared file, capped at 20 MB, 3 backups.
_file_handler = logging.handlers.RotatingFileHandler(
    LOGS_DIR / "scraper.log", maxBytes=20 * 1024 * 1024, backupCount=3, encoding="utf-8"
)
_file_handler.setFormatter(_SCRAPER_LOG_FORMAT)
_file_handler.addFilter(_RequestIdFilter())
log.addHandler(_file_handler)


@contextmanager
def _execution_log(route: str):
    """Set a unique request ID for the duration of the request so log lines from
    concurrent requests remain attributable without per-request file handlers."""
    token = _request_id.set(f"{route}-{uuid.uuid4().hex[:8]}")
    try:
        yield
    finally:
        _request_id.reset(token)


# --- Browser sessions (set by lifespan in main.py) ---------------------------
# Fetcher is classmethods-only in 0.4.x; use Fetcher.get(...) directly.

# Set at startup by the FastAPI lifespan in main.py; never None when a request
# actually runs.  Typed as Any to avoid a circular import with scrapling.
_dynamic_session = None
_stealthy_session = None

_cf_blocked_domains: set[str] = set()

# --- Global concurrency gates --------------------------------------------------
# Single uvicorn worker (see Dockerfile CMD, no --workers flag) so these
# semaphores are process-wide == app-wide. If the service is ever run with
# multiple workers/replicas, each gets its own pool and the "global" cap breaks.
#
# Two pools instead of one flat cap: heavy routes (agent-scrape, and check-mention
# when it falls into the agent-scrape branch) hold a slot for a full multi-page
# crawl (tens of seconds to ~2 min), while light routes (byline-scrape,
# fetch-content) do a single tiered fetch and return fast. Node callers give
# light routes a much tighter abort timeout (byline-scrape: 30s) than heavy ones
# (agent-scrape: 120s, check-mention: 180s) — sharing one pool would let a heavy
# request occupy a slot long enough to blow the light route's timeout budget
# even though nothing actually failed server-side, just queued.
_HEAVY_CONCURRENCY = int(os.getenv("SCRAPE_HEAVY_CONCURRENCY", "3"))
_LIGHT_CONCURRENCY = int(os.getenv("SCRAPE_LIGHT_CONCURRENCY", "8"))
_heavy_semaphore = asyncio.Semaphore(_HEAVY_CONCURRENCY)
_light_semaphore = asyncio.Semaphore(_LIGHT_CONCURRENCY)


@asynccontextmanager
async def _scrape_slot(pool: str):
    """Acquire a global concurrency slot for the given pool ("heavy" | "light").
    Blocks (does not fail) while the pool is full — callers just wait in line."""
    semaphore = _heavy_semaphore if pool == "heavy" else _light_semaphore
    waited = semaphore.locked()
    if waited:
        log.info(f"scrape slot ({pool}) full, queueing")
    async with semaphore:
        if waited:
            log.info(f"scrape slot ({pool}) acquired after wait")
        yield

# --- Auth --------------------------------------------------------------------
API_KEY = os.getenv("API_KEY")
_api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)


def _require_api_key(key: str | None = Security(_api_key_header)):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Server misconfiguration: API_KEY not set")
    if key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


# --- SSRF guard --------------------------------------------------------------
_PRIVATE_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # link-local / AWS metadata
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]


async def _ssrf_check(url: str) -> None:
    """Raise HTTPException 400 if the URL resolves to a private/internal address."""
    host = urlparse(url).hostname
    if not host:
        raise HTTPException(status_code=400, detail="Invalid URL: no host")
    try:
        infos = await asyncio.to_thread(socket.getaddrinfo, host, None)
    except socket.gaierror as e:
        raise HTTPException(status_code=400, detail=f"Cannot resolve host: {e}")
    for _, _, _, _, sockaddr in infos:
        ip = ipaddress.ip_address(sockaddr[0])
        if any(ip in net for net in _PRIVATE_NETWORKS):
            raise HTTPException(status_code=400, detail="URL resolves to a private/internal address")


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

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

# Matches obfuscated emails using bracket/paren "at"/"dot" tokens or HTML entities
# (e.g. "jane [at] company [dot] com"). Deliberately excludes plain "@"/"." — those
# already match via _EMAIL_RE, and re-matching them here with `\s*` padding produces
# false positives on ordinary prose (a "@handle" mention followed by a sentence-ending
# period reads as "handle@word.NextWord").
_AT_VARIANTS = r"(?:\[at\]|\(at\)|&#0*64;|&commat;)"
_DOT_VARIANTS = r"(?:\[dot\]|\(dot\)|&#0*46;|&period;)"
_OBFUSCATED_EMAIL_RE = re.compile(
    rf"[a-zA-Z0-9._%+\-]+\s*{_AT_VARIANTS}\s*[a-zA-Z0-9\-]+(?:\s*{_DOT_VARIANTS}\s*[a-zA-Z0-9\-]+)+",
    re.IGNORECASE,
)
_AT_SUB_RE = re.compile(_AT_VARIANTS, re.IGNORECASE)
_DOT_SUB_RE = re.compile(_DOT_VARIANTS, re.IGNORECASE)


def _normalize_obfuscated_email(raw: str) -> str:
    normalized = _AT_SUB_RE.sub("@", raw)
    normalized = _DOT_SUB_RE.sub(".", normalized)
    return re.sub(r"\s+", "", normalized)


def extract_emails_from_text(text: str) -> list[str]:
    found = _EMAIL_RE.findall(text)
    for match in _OBFUSCATED_EMAIL_RE.finditer(text):
        normalized = _normalize_obfuscated_email(match.group(0))
        if _EMAIL_RE.fullmatch(normalized):
            found.append(normalized)

    seen: set[str] = set()
    deduped: list[str] = []
    for e in found:
        key = e.lower()
        if key not in seen:
            seen.add(key)
            deduped.append(e)

    return [e for e in deduped if e.rsplit("@", 1)[-1].lower() not in _PLACEHOLDER_EMAIL_DOMAINS_CORE]


def decode_cf_email(encoded: str) -> str | None:
    """Decode a Cloudflare email-protection payload: first byte is the XOR key,
    applied to every subsequent byte to recover the ASCII address. Same encoding
    backs both `data-cfemail` attributes and `cdn-cgi/l/email-protection#<hex>` hrefs."""
    encoded = encoded.strip()
    hash_idx = encoded.rfind("#")
    if hash_idx != -1:
        encoded = encoded[hash_idx + 1 :]
    if len(encoded) < 4 or len(encoded) % 2 != 0:
        return None
    try:
        key = int(encoded[:2], 16)
        decoded = bytes(int(encoded[i : i + 2], 16) ^ key for i in range(2, len(encoded), 2))
        email = decoded.decode("utf-8")
        return email if _EMAIL_RE.fullmatch(email) else None
    except (ValueError, UnicodeDecodeError):
        return None


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


def _normalize_url(url: str) -> str:
    """Normalize URL for cache comparisons: lowercase scheme+host, strip trailing slash."""
    try:
        p = urlparse(url)
        path = p.path.rstrip("/") or "/"
        normalized = f"{p.scheme.lower()}://{p.netloc.lower()}{path}"
        if p.query:
            normalized += f"?{p.query}"
        return normalized
    except Exception:
        return url


def _is_ok_status(page) -> bool:
    """True if the page has a 2xx HTTP status (or status is unavailable)."""
    status = getattr(page, "status", None)
    if status is None:
        return True
    return 200 <= status < 300


_TERMINAL_STATUSES = {404, 410}


async def fetch_page(url: str):
    await _ssrf_check(url)
    try:
        log.info(f"fetching lightweight {url}")
        page = await asyncio.to_thread(
            Fetcher.get, url, timeout=15, stealthy_headers=True
        )
        text = str(page.get_all_text()).strip()
        status = getattr(page, "status", None)
        if not _is_ok_status(page):
            if status in _TERMINAL_STATUSES:
                log.info(f"light fetch terminal status={status}, giving up {url}")
                return None
            log.info(f"light fetch non-2xx status={status}, escalating to dynamic {url}")
        elif len(text) >= 500:
            log.info(f"fetched ok (light) status={status} {url}")
            return page
        else:
            log.info(f"light fetch thin content ({len(text)} chars), escalating to dynamic {url}")
    except Exception as e:
        log.warning(f"light fetch failed {url}: {e}, escalating to dynamic")

    try:
        log.info(f"fetching dynamic {url}")
        page = await _dynamic_session.fetch(url)
        text = str(page.get_all_text()).strip()
        status = getattr(page, "status", None)
        if not _is_ok_status(page):
            if status in _TERMINAL_STATUSES:
                log.info(f"dynamic fetch terminal status={status}, giving up {url}")
                return None
            log.info(f"dynamic fetch non-2xx status={status}, escalating to stealthy {url}")
        elif len(text) >= 500:
            log.info(f"fetched ok (dynamic) status={status} {url}")
            return page
        else:
            log.info(f"dynamic fetch thin content ({len(text)} chars), escalating to stealthy {url}")
    except Exception as e:
        log.warning(f"dynamic fetch failed {url}: {e}, escalating to stealthy")

    try:
        log.info(f"fetching stealthy {url}")
        page = await _stealthy_session.fetch(url)
        stealthy_text = str(page.get_all_text()).strip()
        stealthy_html = (page.html_content or "")
        stealthy_status = getattr(page, "status", None)
        is_cf_challenge = "<title>Just a moment" in stealthy_html
        log.info(
            f"stealthy result: status={stealthy_status} "
            f"text_len={len(stealthy_text)} html_len={len(stealthy_html)} "
            f"cf_challenge={is_cf_challenge} url={url}"
        )
        log.info(f"stealthy html snippet: {stealthy_html[:400]!r}")
        if is_cf_challenge:
            log.warning(f"stealthy: CF challenge not bypassed {url} — marking domain blocked")
            _cf_blocked_domains.add(_normalize_host(urlparse(url).netloc))
            return None
        if not _is_ok_status(page):
            log.warning(f"stealthy: non-2xx status={stealthy_status} {url}")
            return None
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
        el = page.css(sel).first
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
            "decode_cf_email": decode_cf_email,
            "get_base_url": get_base_url,
            "strip_html_attrs": strip_html_attrs,
            "_first_el": _first_el,
            "find_contact_form_url": find_contact_form_url,
            "_host_matches_target": _host_matches_target,
            "_normalize_url": _normalize_url,
            "_normalize_host": _normalize_host,
            "cf_blocked_domains": _cf_blocked_domains,
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
    normalized_seed = _normalize_url(seed_url)
    state = {"used": False}

    async def cached_fetch(url: str):
        if not state["used"] and _normalize_url(url) == normalized_seed:
            state["used"] = True
            return seed_page
        return await real_fetch(url)

    return {**helpers, "fetch_page": cached_fetch}


__all__ = [
    "log",
    "_execution_log",
    "_require_api_key",
    "_scrape_slot",
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
    "_clean_name",
    "_extract_author_hints",
]
