import asyncio
import contextvars
import ipaddress
import logging
import logging.handlers
import os
import re
import socket
import time
import uuid
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
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

class _ScraplingCloudflareNoiseFilter(logging.Filter):
    """scrapling's own `_stealth.py` logs 'No Cloudflare challenge found.' at
    ERROR level on the benign no-challenge-present path (not a failure) —
    downgrade just that message so it stops flooding error-level log queries."""

    def filter(self, record: logging.LogRecord) -> bool:
        if record.levelno == logging.ERROR and record.getMessage() == "No Cloudflare challenge found.":
            record.levelno = logging.WARNING
            record.levelname = "WARNING"
        return True


logging.getLogger("scrapling").addFilter(_ScraplingCloudflareNoiseFilter())


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

# Async factory that builds + starts a fresh AsyncStealthySession with the same
# kwargs as the original (set by main.py's lifespan). Used to replace
# _stealthy_session after its shared browser context dies — see
# _restart_stealthy_session_if_needed below.
_stealthy_session_factory = None

class _TTLBlockedSet:
    """Set-like structure for cf_blocked_domains with per-entry expiry.

    A plain `set()` here never evicts for the process lifetime — one
    Cloudflare block on a host permanently blinds every future fetch to that
    host (and everything that shares it, e.g. every tracked link on that
    blog). Supports `add`/`in` like a plain set so existing call sites
    (including the `cf_blocked_domains` entry in `_get_agent_helpers()`)
    don't need to change."""

    def __init__(self, ttl_s: float):
        self._ttl_s = ttl_s
        self._expiry: dict[str, float] = {}

    def add(self, host: str) -> None:
        self._expiry[host] = time.monotonic() + self._ttl_s

    def __contains__(self, host: str) -> bool:
        expiry = self._expiry.get(host)
        if expiry is None:
            return False
        if time.monotonic() >= expiry:
            del self._expiry[host]
            return False
        return True


_CF_BLOCK_TTL_S = float(os.getenv("CF_BLOCKED_DOMAIN_TTL_S", str(6 * 3600)))
_cf_blocked_domains = _TTLBlockedSet(_CF_BLOCK_TTL_S)


# --- Residential proxy for the stealthy (Cloudflare) tier --------------------
# The Railway host is a datacenter IP, which Cloudflare's managed-challenge tier
# scores as a bot regardless of fingerprint quality — so the stealthy tier still
# loses strict-WAF sites. Routing just that tier through a residential IP flips
# the IP-reputation signal. Applied ONLY to the stealthy escalation: the light
# (httpx) and dynamic (Chromium) tiers work fine on the datacenter IP, and
# proxying them would burn metered residential bandwidth for no reputation gain.
#
# Fully opt-in: unset or malformed STEALTHY_PROXY -> None -> today's behavior
# (no proxy). Provider format is host:port:user:pass (what the proxy vendor
# hands you); parsed into the {'server','username','password'} dict Scrapling
# expects. Kept out of source — set via .env (gitignored) / Railway env vars.
def _parse_proxy(raw: str | None) -> dict[str, str] | None:
    if not raw:
        return None
    parts = raw.split(":")
    if len(parts) != 4 or not all(parts):
        log.warning("STEALTHY_PROXY set but malformed (want host:port:user:pass) — ignoring, using direct")
        return None
    host, port, username, password = parts
    return {"server": f"http://{host}:{port}", "username": username, "password": password}


_STEALTHY_PROXY = _parse_proxy(os.getenv("STEALTHY_PROXY"))

# Circuit breaker: once the proxy itself proves unreachable, skip it for a
# cooldown so a dead proxy costs one double-attempt every _PROXY_COOLDOWN_S
# rather than on every stealthy fetch. monotonic() is immune to wall-clock
# jumps. Single-worker process (see below) so this plain float needs no lock.
_PROXY_COOLDOWN_S = float(os.getenv("STEALTHY_PROXY_COOLDOWN_S", "300"))
_proxy_unhealthy_until = 0.0

# Playwright error signatures that mean the PROXY is broken (not the target
# site) — these fail fast, so falling back to a direct attempt stays within the
# caller's abort budget. A TimeoutError is deliberately NOT here: a timeout
# means the proxy connected but the solve ran long, and retrying direct would
# just double the wait.
_PROXY_INFRA_SIGNATURES = (
    "ERR_PROXY_CONNECTION_FAILED",
    "ERR_TUNNEL_CONNECTION_FAILED",
    "ERR_NO_SUPPORTED_PROXIES",
    "ERR_SOCKS_CONNECTION_FAILED",
    "ERR_PROXY_AUTH",
    "proxy connection",
    "connection refused",
    # Session-wiring mismatch (e.g. AsyncStealthySession started without
    # proxy_rotator so self.browser is None) — not proxy-reachability, but same
    # dead end for a proxied call, so treat it as infra and fall back direct.
    "browser not initialized",
)

# Sentinel distinct from None: the proxy infra failed, so the caller should
# retry the same fetch directly. None still means "give up on this URL".
_INFRA_FAILURE = object()

# The one shared persistent browser context backing _stealthy_session died
# (Chromium/Camoufox process crashed or was torn down, most likely OOM under a
# cron-burst concurrency spike — see 2026-07-22-stealthy-browser-context-crash.md).
# Every concurrent caller hits this identically until the session is replaced,
# so it's a distinct sentinel from a plain fetch error: the caller should
# restart the shared session (once, not once per caller) and retry.
_CONTEXT_DEAD = object()
_CONTEXT_DEAD_SIGNATURE = "context or browser has been closed"

# Serializes session restarts so a burst of callers hitting the same dead
# context trigger exactly one restart, not one each. Callers that lose the
# race just wait for the lock, then see the fresh session already swapped in
# by the winner (checked via identity, not a counter).
_stealthy_restart_lock = asyncio.Lock()


async def _restart_stealthy_session_if_needed(dead_session) -> None:
    """Replace the shared stealthy session after its browser context died.
    `dead_session` is whatever the caller observed _stealthy_session to be
    before it hit the error — if it no longer matches the live
    _stealthy_session by the time this acquires the lock, another caller
    already restarted it, so this is a no-op."""
    global _stealthy_session
    async with _stealthy_restart_lock:
        if _stealthy_session is not dead_session:
            return
        log.error("stealthy browser context died — restarting shared stealthy session")
        try:
            await dead_session.close()
        except Exception as e:
            log.warning(f"error closing dead stealthy session (ignoring): {e}")
        _stealthy_session = await _stealthy_session_factory()
        log.info("stealthy session restarted")


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
#
# Sizing: heavy must not exceed the dynamic session's max_pages (main.py) or
# heavy jobs queue on browser tabs instead of here, invisibly. The Node caller
# mirrors these caps in apps/server/src/helpers/scraper-limits.ts so requests
# queue client-side (before their abort timeout starts) rather than in here.
_HEAVY_CONCURRENCY = int(os.getenv("SCRAPE_HEAVY_CONCURRENCY", "10"))
_LIGHT_CONCURRENCY = int(os.getenv("SCRAPE_LIGHT_CONCURRENCY", "16"))
_heavy_semaphore = asyncio.Semaphore(_HEAVY_CONCURRENCY)
_light_semaphore = asyncio.Semaphore(_LIGHT_CONCURRENCY)

# Third pool gating entry into fetch_page's stealthy (Camoufox) escalation tier
# specifically — independent of heavy/light route-entry caps. Up to
# _HEAVY_CONCURRENCY + _LIGHT_CONCURRENCY callers can independently escalate
# into the stealthy tier at once (route-level caps don't protect against that,
# see 2026-07-22-stealthy-browser-context-crash.md); Scrapling's own
# _STEALTHY_MAX_PAGES page-pool queues callers for a free page but does not cap
# how many pile up waiting, which is plausibly what starves/crashes the single
# shared browser context under cron-burst concurrency. Sized well below
# STEALTHY_MAX_PAGES's page pool by default so this queues before that does.
_STEALTHY_CONCURRENCY = int(os.getenv("SCRAPE_STEALTHY_CONCURRENCY", "3"))
_stealthy_semaphore = asyncio.Semaphore(_STEALTHY_CONCURRENCY)

_SEMAPHORES = {"heavy": _heavy_semaphore, "light": _light_semaphore, "stealthy": _stealthy_semaphore}

# Live occupancy per pool, for the /health endpoint and queue logging. Guarded
# only by the single-threaded event loop — no lock needed.
_pool_stats = {
    "heavy": {"active": 0, "waiting": 0, "capacity": _HEAVY_CONCURRENCY},
    "light": {"active": 0, "waiting": 0, "capacity": _LIGHT_CONCURRENCY},
    "stealthy": {"active": 0, "waiting": 0, "capacity": _STEALTHY_CONCURRENCY},
}


def pool_stats() -> dict:
    return {pool: dict(stats) for pool, stats in _pool_stats.items()}


@asynccontextmanager
async def _scrape_slot(pool: str):
    """Acquire a global concurrency slot for the given pool ("heavy" | "light" |
    "stealthy"). Blocks (does not fail) while the pool is full — callers just
    wait in line."""
    semaphore = _SEMAPHORES[pool]
    stats = _pool_stats[pool]
    waited = semaphore.locked()
    if waited:
        log.info(f"scrape slot ({pool}) full, queueing (waiting={stats['waiting'] + 1})")
    stats["waiting"] += 1
    try:
        await semaphore.acquire()
    finally:
        stats["waiting"] -= 1
    stats["active"] += 1
    try:
        if waited:
            log.info(f"scrape slot ({pool}) acquired after wait")
        yield
    finally:
        stats["active"] -= 1
        semaphore.release()

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
            # Bare `<a href>` is valid HTML and stdlib's parser reports its value as
            # None (not ""), so guard before .strip() — the `or ""` covers both the
            # missing-key and present-but-None cases.
            self._current_href = (dict(attrs).get("href") or "").strip() or None
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


_TERMINAL_STATUSES = {404, 410, 451}


def _proxy_in_cooldown() -> bool:
    return time.monotonic() < _proxy_unhealthy_until


def _trip_proxy_cooldown() -> None:
    global _proxy_unhealthy_until
    _proxy_unhealthy_until = time.monotonic() + _PROXY_COOLDOWN_S
    log.warning(f"stealthy proxy tripped cooldown for {_PROXY_COOLDOWN_S:.0f}s — using direct until it clears")


@dataclass
class FetchOutcome:
    """Result of fetch_page_detailed — distinguishes WHY a fetch didn't yield a
    usable page (terminal-dead vs Cloudflare-blocked vs a genuine transient
    failure) instead of collapsing all three to None like fetch_page() does.
    Callers that must not conflate "the page is really gone" with "we
    temporarily couldn't verify it" (the link tracker, primarily — a false
    'link removed' alert destroys trust) need this distinction; the four
    original callers (agent-scrape, check-mention, byline-scrape,
    fetch-content) don't, so they keep using fetch_page()."""

    page: Any | None
    outcome: str  # "ok" | "dead" | "http_error" | "cf_blocked" | "fetch_failed"
    status_code: int | None = None
    final_url: str | None = None


async def _stealthy_attempt_detailed(url: str, host: str, proxy: dict[str, str] | None) -> "FetchOutcome | object":
    """One stealthy (Camoufox) fetch. Returns a FetchOutcome, or the
    _INFRA_FAILURE / _CONTEXT_DEAD sentinels (unchanged from before this
    refactor) when a proxy is unreachable or the shared browser context died —
    both signal the caller to retry rather than give up on this URL."""
    via = "proxy" if proxy else "direct"
    try:
        # Only pass proxy= when set, so the no-proxy path stays byte-identical
        # to the original direct call.
        page = await (_stealthy_session.fetch(url, proxy=proxy) if proxy else _stealthy_session.fetch(url))
        stealthy_text = str(page.get_all_text()).strip()
        stealthy_html = (page.html_content or "")
        stealthy_status = getattr(page, "status", None)
        stealthy_url = getattr(page, "url", None)
        is_cf_challenge = "<title>Just a moment" in stealthy_html
        log.info(
            f"stealthy result ({via}): status={stealthy_status} "
            f"text_len={len(stealthy_text)} html_len={len(stealthy_html)} "
            f"cf_challenge={is_cf_challenge} url={url}"
        )
        log.info(f"stealthy html snippet: {stealthy_html[:400]!r}")
        # A 407 status means the proxy rejected our auth — infra, not the site.
        if proxy and stealthy_status == 407:
            log.warning(f"stealthy ({via}): proxy auth failed (407) {url}")
            log.info(f"fetch_outcome=proxy_infra_failure host={host} url={url}")
            return _INFRA_FAILURE
        if is_cf_challenge:
            log.warning(f"stealthy ({via}): CF challenge not bypassed {url} — marking domain blocked")
            _cf_blocked_domains.add(host)
            log.info(f"fetch_outcome=cf_blocked via={via} host={host} url={url}")
            return FetchOutcome(page=None, outcome="cf_blocked", status_code=stealthy_status, final_url=stealthy_url)
        if not _is_ok_status(page):
            if stealthy_status in _TERMINAL_STATUSES:
                log.info(f"fetch_outcome=terminal_stealthy status={stealthy_status} url={url}")
                return FetchOutcome(page=page, outcome="dead", status_code=stealthy_status, final_url=stealthy_url)
            log.info(f"fetch_outcome=non2xx_stealthy via={via} status={stealthy_status} url={url}")
            return FetchOutcome(page=page, outcome="http_error", status_code=stealthy_status, final_url=stealthy_url)
        log.info(f"fetch_outcome=ok_stealthy_{via} status={stealthy_status} url={url}")
        return FetchOutcome(page=page, outcome="ok", status_code=stealthy_status, final_url=stealthy_url)
    except Exception as e:
        msg = str(e)
        if _CONTEXT_DEAD_SIGNATURE in msg.lower():
            log.error(f"stealthy ({via}): shared browser context dead {url}: {e}")
            log.info(f"fetch_outcome=context_dead via={via} host={host} url={url}")
            return _CONTEXT_DEAD
        if proxy and any(sig.lower() in msg.lower() for sig in _PROXY_INFRA_SIGNATURES):
            log.warning(f"stealthy ({via}): proxy infra error {url}: {e}")
            log.info(f"fetch_outcome=proxy_infra_failure host={host} url={url}")
            return _INFRA_FAILURE
        log.error(f"stealthy fetch failed ({via}) {url}: {e}")
        log.info(f"fetch_outcome=error_stealthy via={via} host={host} url={url}")
        return FetchOutcome(page=None, outcome="fetch_failed")


async def fetch_page(url: str):
    """Backward-compatible wrapper over fetch_page_detailed: page on a clean
    fetch, None for anything else (dead / cf_blocked / http_error /
    fetch_failed) — the exact contract every existing caller (agent-scrape,
    check-mention, byline-scrape, fetch-content, the enrichment agent) relies
    on. New code that needs to tell those apart should call
    fetch_page_detailed directly."""
    result = await fetch_page_detailed(url)
    return result.page if result.outcome == "ok" else None


async def fetch_page_detailed(url: str, force_dynamic: bool = False) -> FetchOutcome:
    """Outcome-aware version of the three-tier escalation (light httpx ->
    dynamic Chromium -> stealthy Camoufox+proxy+CF-solve). `force_dynamic`
    skips the light tier and starts at Chromium — used by the link tracker's
    confirmation pass, since some sites render their link list client-side
    and a thin-but-real light-tier response would otherwise read as "link
    gone" a day early."""
    await _ssrf_check(url)

    # A host that already failed the stealthy (top) tier with a live Cloudflare
    # challenge earlier in this process won't behave differently for a sibling
    # URL — CF challenges are enforced per-host, not per-path. Skip the full
    # light->dynamic->stealthy escalation instead of re-paying it (and burning
    # the caller's abort budget) to reach the same dead end.
    host = _normalize_host(urlparse(url).netloc)
    if host in _cf_blocked_domains:
        log.info(f"fetch_outcome=cf_skipped host={host} url={url}")
        return FetchOutcome(page=None, outcome="cf_blocked")

    if not force_dynamic:
        try:
            log.info(f"fetching lightweight {url}")
            # retries=1: curl_cffi's CookieConflict (same cookie name set on two
            # domains within one redirect chain) is deterministic, not transient —
            # its default 3x/1s-apart retry just repeats the identical failure
            # before we escalate to dynamic anyway.
            page = await asyncio.to_thread(
                Fetcher.get, url, timeout=15, stealthy_headers=True, retries=1
            )
            text = str(page.get_all_text()).strip()
            status = getattr(page, "status", None)
            if not _is_ok_status(page):
                if status in _TERMINAL_STATUSES:
                    log.info(f"fetch_outcome=terminal_light status={status} url={url}")
                    return FetchOutcome(page=page, outcome="dead", status_code=status, final_url=getattr(page, "url", None))
                log.info(f"light fetch non-2xx status={status}, escalating to dynamic {url}")
            elif len(text) >= 500:
                log.info(f"fetch_outcome=ok_light status={status} url={url}")
                return FetchOutcome(page=page, outcome="ok", status_code=status, final_url=getattr(page, "url", None))
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
                log.info(f"fetch_outcome=terminal_dynamic status={status} url={url}")
                return FetchOutcome(page=page, outcome="dead", status_code=status, final_url=getattr(page, "url", None))
            log.info(f"dynamic fetch non-2xx status={status}, escalating to stealthy {url}")
        elif len(text) >= 500:
            log.info(f"fetch_outcome=ok_dynamic status={status} url={url}")
            return FetchOutcome(page=page, outcome="ok", status_code=status, final_url=getattr(page, "url", None))
        else:
            log.info(f"dynamic fetch thin content ({len(text)} chars), escalating to stealthy {url}")
    except Exception as e:
        log.warning(f"dynamic fetch failed {url}: {e}, escalating to stealthy")

    # Stealthy (Cloudflare) tier. Gated by its own semaphore (separate from the
    # heavy/light route-entry pools) so a cron burst can't pile every concurrent
    # task onto the single shared browser context at once.
    log.info(f"fetching stealthy {url}")
    async with _scrape_slot("stealthy"):
        return await _stealthy_fetch_with_recovery_detailed(url, host)


async def _stealthy_fetch_with_recovery_detailed(url: str, host: str) -> FetchOutcome:
    """Run the stealthy tier, recovering once from a dead shared browser
    context: restart the shared session and retry the whole tier exactly once,
    then give up rather than retry forever against a context that keeps dying."""
    for attempt in range(2):
        session_before = _stealthy_session
        result = await _stealthy_tier_attempt_detailed(url, host)

        if result is _CONTEXT_DEAD:
            if attempt == 0:
                await _restart_stealthy_session_if_needed(session_before)
                continue
            log.error(f"stealthy fetch still failing after session restart {url}")
            return FetchOutcome(page=None, outcome="fetch_failed")

        if result is _INFRA_FAILURE:
            return FetchOutcome(page=None, outcome="fetch_failed")

        return result

    return FetchOutcome(page=None, outcome="fetch_failed")  # pragma: no cover — loop always returns or continues once


async def _stealthy_tier_attempt_detailed(url: str, host: str):
    """One pass through the stealthy tier: proxy-first with a direct fallback
    on proxy infra failure. When a residential proxy is configured and
    currently healthy, try it first — it's the only tier where the datacenter
    IP actually loses. On a proxy INFRA failure (proxy unreachable/auth, which
    fails fast) fall back to a direct attempt so a dead proxy never takes down
    all stealthy fetches, and trip a cooldown so the next fetches skip straight
    to direct. A timeout or genuine CF block is NOT an infra failure: the proxy
    worked and the site is just hard, so we don't waste a second full attempt."""
    use_proxy = _STEALTHY_PROXY is not None and not _proxy_in_cooldown()
    if use_proxy:
        result = await _stealthy_attempt_detailed(url, host, proxy=_STEALTHY_PROXY)
        if result is _INFRA_FAILURE:
            _trip_proxy_cooldown()
            result = await _stealthy_attempt_detailed(url, host, proxy=None)
        return result
    return await _stealthy_attempt_detailed(url, host, proxy=None)


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


# nofollow/ugc/sponsored — kept in sync with REL_TOKENS in
# apps/web/lib/free-tools/fetch-page-links.ts so both sides classify rel
# attributes identically.
_REL_TOKENS = {"nofollow", "ugc", "sponsored"}


def _anchors_to_target(page, base_url: str, target_domain: str) -> list[dict]:
    """Every anchor on `page` resolving to `target_domain` (or a subdomain of
    it), undeduped — unlike _links_to_target's plain href list, this keeps the
    per-anchor rel/anchor-text/image detail the link tracker needs to diff
    against what it observed on the previous check."""
    found: list[dict] = []
    for el in page.css("a[href]"):
        href = el.attrib.get("href", "").strip()
        if not href or href.startswith(("mailto:", "tel:", "#", "javascript:")):
            continue
        full = urljoin(base_url, href)
        try:
            host = urlparse(full).netloc
        except Exception:
            continue
        if not host or not _host_matches_target(host, target_domain):
            continue
        rel_attr = (el.attrib.get("rel", "") or "").strip().lower()
        rel_tokens = [token for token in rel_attr.split() if token in _REL_TOKENS]
        anchor_text = " ".join(str(el.get_all_text(strip=True)).split())
        children = el.children
        # An anchor whose only child is an <img> and carries no text is a
        # badge/logo link — anchor_changed should never fire on those.
        is_image_link = not anchor_text and len(children) == 1 and children[0].tag == "img"
        found.append(
            {
                "href": full,
                "rel_tokens": rel_tokens,
                "anchor_text": anchor_text,
                "is_dofollow": len(rel_tokens) == 0,
                "is_image_link": is_image_link,
            }
        )
    return found


def _links_to_target(page, base_url: str, target_domain: str) -> list[str]:
    """Deduped href list — thin wrapper over _anchors_to_target so the two
    can't drift. Unchanged signature/behavior; used by check_mention.py."""
    seen: set[str] = set()
    hrefs: list[str] = []
    for anchor in _anchors_to_target(page, base_url, target_domain):
        if anchor["href"] not in seen:
            seen.add(anchor["href"])
            hrefs.append(anchor["href"])
    return hrefs


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
    "pool_stats",
    "_get_agent_helpers",
    "_seeded_helpers",
    "_links_to_target",
    "_anchors_to_target",
    "_host_matches_target",
    "_normalize_host",
    "_ssrf_check",
    "fetch_page",
    "fetch_page_detailed",
    "FetchOutcome",
    "get_base_url",
    "ScrapeRequest",
    "CheckMentionRequest",
    "CheckMentionResponse",
    "AgentScrapeResponse",
    "run_agent_scrape",
    "_clean_name",
    "_extract_author_hints",
]
