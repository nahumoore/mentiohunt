import asyncio
import json
import logging
import os
import re
import time
from urllib.parse import urljoin, urlparse

from openai import AsyncOpenAI
from pydantic import BaseModel

log = logging.getLogger("scraper")

MODEL = "z-ai/glm-4.7-flash"
FALLBACK_MODEL = "google/gemini-2.5-flash"
EMPTY_RESPONSE_FALLBACK_MODEL = "deepseek/deepseek-v4-flash"  # retried when a model returns 200 OK with no tool_calls (OpenRouter "zero completion" glitch), distinct from FALLBACK_MODEL used for hard exceptions
MAX_PAGES = 6
AGENT_BUDGET_SECONDS = 100  # wall-clock cap; must land under the server's 120s AbortSignal
MODEL_CALL_TIMEOUT_SECONDS = 30  # hard backstop — the SDK's `timeout=` kwarg only bounds gaps between chunks, not total call duration, and deepseek-v4-pro has been observed taking 150s+ on OpenRouter; the fast fallback model makes bailing out early worth it

_GENERIC_PREFIXES = {"noreply", "no-reply", "support", "team", "hello", "info", "contact", "admin", "enquiries", "enquiry", "mail", "office", "sales", "marketing", "press", "media", "billing", "accounts", "hr", "jobs", "careers", "legal", "privacy", "abuse", "postmaster", "webmaster", "newsletter", "notifications"}

_PLACEHOLDER_EMAIL_DOMAINS = {"example.com", "example.org", "example.net", "test.com", "domain.com", "email.com", "yourdomain.com", "sample.com", "acme.com", "placeholder.com", "fakeemail.com"}

_NAME_BLOCKLIST = {"null", "none", "n/a", "na", "undefined", "unknown", "finish", "scrape_page", "anonymous", "author", "admin", "editor", "staff", "team"}

# Substrings that indicate the LLM returned a scraper failure description or a
# refusal to name a real person, instead of a real name.
_NAME_FAILURE_SUBSTRINGS = [
    "unable",
    "cannot",
    "could not",
    "access denied",
    "site could",
    "error",
    "no real person",
    "not identified",
    "no individual",
    "not able to identify",
    "no author",
    "no name",
    "not found",
    "not available",
    "no person",
]


def _clean_name(name: str | None) -> str | None:
    """Sanitize LLM-produced contact name; returns None for garbage values."""
    if not isinstance(name, str) or not name:
        return None
    trimmed = name.strip()
    if not trimmed or len(trimmed) > 60:
        return None
    if not any(c.isalpha() for c in trimmed):
        return None
    if trimmed.lower() in _NAME_BLOCKLIST:
        return None
    lower = trimmed.lower()
    if any(s in lower for s in _NAME_FAILURE_SUBSTRINGS):
        return None
    if len(trimmed.split()) > 5:
        return None
    return trimmed


def _clean_bio(bio: str | None) -> str | None:
    """Drop LLM-produced bio text that actually describes a scrape/access failure."""
    if not isinstance(bio, str) or not bio:
        return None
    trimmed = bio.strip()
    if not trimmed:
        return None
    lower = trimmed.lower()
    if any(s in lower for s in _NAME_FAILURE_SUBSTRINGS):
        return None
    return trimmed


def _is_placeholder_email(email: str) -> bool:
    """True if the email address is a known placeholder/sample address."""
    at_idx = email.rfind("@")
    if at_idx < 0:
        return True
    domain = email[at_idx + 1:].lower()
    return domain in _PLACEHOLDER_EMAIL_DOMAINS

_SCRAPE_PAGE_TOOL = {
    "type": "function",
    "function": {
        "name": "scrape_page",
        "description": (
            "Fetch a page on the same domain and extract contact data. "
            "Returns name, emails, social links, page markdown, and available internal links."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "Full URL to scrape. Must be on the target domain."},
            },
            "required": ["url"],
        },
    },
}

_FINISH_TOOL = {
    "type": "function",
    "function": {
        "name": "finish",
        "description": "Call when you have enough data or exhausted useful pages.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Cleaned full name of the article author or site founder/owner — must be a real human person's name (e.g. 'John Smith'). NEVER set this to a company name, brand name, platform name, or any description of a page error or access failure. If the page shows an error (WordPress error, 404, 500, timeout, blocked), set to null. If no individual person is identified, set to null."},
                "emails": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "value": {"type": "string", "description": "The email address."},
                            "type": {
                                "type": "string",
                                "enum": ["personal", "general"],
                                "description": "personal = first name or first.last prefix; general = generic inbox (info@, contact@, etc.).",
                            },
                        },
                        "required": ["value", "type"],
                    },
                    "description": "All emails found, deduplicated, personal ones first.",
                },
                "social_links": {
                    "type": "object",
                    "description": 'Platform -> URL map e.g. {"linkedin": "https://..."}.',
                },
                "bio": {
                    "type": "string",
                    "description": "2-sentence bio for personalized cold outreach, or null.",
                },
                "contact_form_url": {
                    "type": "string",
                    "description": "URL of contact form if found, or null.",
                },
            },
            "required": ["name", "emails", "social_links", "bio", "contact_form_url"],
        },
    },
}


class EmailEntry(BaseModel):
    value: str
    type: str  # "personal" | "general"


class NamedEmail(BaseModel):
    name: str
    email: str


class AgentScrapeResponse(BaseModel):
    name: str | None
    emails: list[EmailEntry]
    social_links: dict[str, str]
    bio: str | None
    contact_form_url: str | None
    confidence: str  # "personalized" | "email-only" | "generic" | "none"
    visited_urls: list[str]
    author_hints: list[str] = []
    author_url: str | None = None
    known_pairs: list[NamedEmail] = []


def _is_personal(email: str) -> bool:
    prefix = email.split("@")[0].lower()
    for p in _GENERIC_PREFIXES:
        if prefix == p or prefix.startswith(f"{p}.") or prefix.startswith(f"{p}-") or prefix.startswith(f"{p}_"):
            return False
    return True


def _confidence(name: str | None, emails: list[EmailEntry]) -> str:
    if name and any(e.type == "personal" for e in emails):
        return "personalized"
    if emails:
        return "email-only"
    if name:
        return "generic"
    return "none"


_AUTHOR_URL_RE = re.compile(r"/author/([a-z0-9\-_.]+)/?$", re.IGNORECASE)

_BYLINE_RE = re.compile(
    r"\b(?:by|written by|words by|author)\s*:?\s+([A-Z][a-zA-Z'\-]+(?:\s+[A-Z][a-zA-Z'\-]+){0,3})"
)

_NAME_LIKE_RE = re.compile(r"^[A-Z][a-zA-Z'\-]+(?:\s+[A-Z][a-zA-Z'\-]+){1,3}$")

_NAME_LIKE_BLOCKLIST_WORDS = {"email", "contact", "send", "click", "here", "mailto", "subscribe", "newsletter"}


def _slug_to_name(slug: str) -> str | None:
    """Humanize a URL slug (e.g. 'jane-doe' -> 'Jane Doe') if it looks like a real name."""
    cleaned = re.sub(r"[-_.]+", " ", slug).strip()
    if not cleaned or not any(c.isalpha() for c in cleaned):
        return None
    words = [w for w in cleaned.split() if w]
    if not (1 <= len(words) <= 4) or any(w.isdigit() for w in words):
        return None
    return " ".join(w.capitalize() for w in words)


def _looks_like_name(text: str) -> bool:
    text = text.strip()
    if not text or len(text) > 50:
        return False
    if not _NAME_LIKE_RE.match(text):
        return False
    lower = text.lower()
    return not any(w in lower for w in _NAME_LIKE_BLOCKLIST_WORDS)


def _resolve_jsonld_author(node, graph_by_id: dict) -> tuple[str | None, str | None]:
    """Resolve a JSON-LD `author` entry (string, Person dict, or @id ref) to (name, url)."""
    if isinstance(node, str):
        return node.strip() or None, None
    if isinstance(node, dict):
        if "@id" in node and "name" not in node:
            resolved = graph_by_id.get(node["@id"])
            if isinstance(resolved, dict):
                node = resolved
        name = (node.get("name") or "").strip() or None
        url = node.get("url") if isinstance(node.get("url"), str) else None
        if not url:
            same_as = node.get("sameAs")
            candidates = same_as if isinstance(same_as, list) else ([same_as] if same_as else [])
            url = next((u for u in candidates if isinstance(u, str) and "linkedin.com" in u.lower()), None)
        return name, url
    return None, None


def _iter_jsonld_blocks(html: str):
    for match in re.finditer(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html or "",
        re.DOTALL | re.IGNORECASE,
    ):
        try:
            yield json.loads(match.group(1))
        except Exception:
            continue


def _extract_author_hints(page) -> dict:
    """Deterministic name/profile-URL extraction. Returns {"names": [...], "urls": [...]}."""
    names: list[str] = []
    urls: list[str] = []

    def _add_name(n: str | None) -> None:
        if n and n not in names:
            names.append(n)

    def _add_url(u: str | None) -> None:
        if u and u not in urls:
            urls.append(u)

    for meta_sel in ('meta[name="author"]', 'meta[property="article:author"]'):
        el = page.css(meta_sel).first
        if el:
            val = el.attrib.get("content", "").strip()
            if val.startswith("http"):
                _add_url(val)
                m = _AUTHOR_URL_RE.search(val)
                if m:
                    _add_name(_slug_to_name(m.group(1)))
            elif val:
                _add_name(val)

    first_el = page.css('meta[property="profile:first_name"]').first
    last_el = page.css('meta[property="profile:last_name"]').first
    if first_el:
        first = first_el.attrib.get("content", "").strip()
        last = last_el.attrib.get("content", "").strip() if last_el else ""
        _add_name(f"{first} {last}".strip() or None)

    for el in page.css('a[rel="author"]'):
        text = str(getattr(el, "text", "") or "").strip()
        _add_name(text or None)
        href = el.attrib.get("href", "")
        if href:
            _add_url(href)
            m = _AUTHOR_URL_RE.search(href)
            if m:
                _add_name(_slug_to_name(m.group(1)))

    # WordPress-style author archive links anywhere on the page.
    for el in page.css("a[href]"):
        href = el.attrib.get("href", "")
        m = _AUTHOR_URL_RE.search(href)
        if m:
            _add_url(href)
            _add_name(_slug_to_name(m.group(1)))

    # JSON-LD: resolve @graph refs, read author name/url + sameAs (LinkedIn).
    for data in _iter_jsonld_blocks(page.html_content or ""):
        items = data if isinstance(data, list) else [data]
        for item in items:
            if not isinstance(item, dict):
                continue
            graph = item.get("@graph")
            graph_by_id = (
                {n["@id"]: n for n in graph if isinstance(n, dict) and "@id" in n} if isinstance(graph, list) else {}
            )
            for node in (graph if isinstance(graph, list) else [item]):
                if not isinstance(node, dict):
                    continue
                author = node.get("author")
                if not author:
                    continue
                candidates = author if isinstance(author, list) else [author]
                for a in candidates:
                    name, url = _resolve_jsonld_author(a, graph_by_id)
                    _add_name(name)
                    _add_url(url)

    # Byline fallback: "By Jane Doe", "Written by Jane Doe", etc.
    text = str(page.get_all_text())[:3000]
    for m in _BYLINE_RE.finditer(text):
        _add_name(m.group(1).strip())

    return {"names": names, "urls": urls}


def _extract_email_name_pairs(page) -> list[dict]:
    """Deterministic name<->email pairing (team/about pages, JSON-LD Person nodes).
    Shared building block for domain email-format inference."""
    pairs: list[dict] = []
    seen: set[str] = set()

    def _add(name: str, email: str) -> None:
        name = name.strip()
        email = email.strip()
        key = email.lower()
        if name and email and "@" in email and key not in seen:
            seen.add(key)
            pairs.append({"name": name, "email": email})

    def _find_person_dicts(node, depth: int = 0) -> list[dict]:
        found: list[dict] = []
        if depth > 3:
            return found
        if isinstance(node, dict):
            if node.get("name") and node.get("email"):
                found.append(node)
            for value in node.values():
                found.extend(_find_person_dicts(value, depth + 1))
        elif isinstance(node, list):
            for item in node:
                found.extend(_find_person_dicts(item, depth + 1))
        return found

    for data in _iter_jsonld_blocks(page.html_content or ""):
        for node in _find_person_dicts(data):
            name = str(node.get("name") or "")
            email = str(node.get("email") or "").replace("mailto:", "")
            _add(name, email)

    for el in page.css("a[href]"):
        href = el.attrib.get("href", "")
        if not href.lower().startswith("mailto:"):
            continue
        text = str(getattr(el, "text", "") or "")
        if _looks_like_name(text):
            _add(text, href[7:].split("?")[0])

    return pairs


async def _execute_scrape_page(url: str, domain: str, visited: list[str], helpers: dict, failed: set | None = None) -> dict:
    fetch_page = helpers["fetch_page"]
    extract_social_links = helpers["extract_social_links"]
    extract_emails_from_text = helpers["extract_emails_from_text"]
    decode_cf_email = helpers["decode_cf_email"]
    get_base_url = helpers["get_base_url"]
    strip_html_attrs = helpers["strip_html_attrs"]
    _first_el = helpers["_first_el"]
    find_contact_form_url = helpers["find_contact_form_url"]
    _host_matches_target = helpers["_host_matches_target"]

    if not _host_matches_target(urlparse(url).netloc, domain):
        log.warning(f"agent tool: blocked external URL {url}")
        return {"error": f"URL must be on {domain}"}

    _normalize_url = helpers.get("_normalize_url", lambda u: u)
    _normalize_host = helpers.get("_normalize_host", lambda h: h)
    norm_url = _normalize_url(url)

    if norm_url in visited:
        log.warning(f"agent tool: already visited {url}")
        return {"error": "Already visited this URL"}

    if failed is not None and norm_url in failed:
        log.warning(f"agent tool: previously failed, skipping {url}")
        return {"error": "Previously failed to fetch this URL"}

    cf_blocked_domains = helpers.get("cf_blocked_domains", set())
    if _normalize_host(domain) in cf_blocked_domains:
        log.warning(f"agent tool: domain CF-blocked, skipping {url}")
        return {"error": "CF-blocked", "cf_blocked": True}

    log.info(f"agent tool scrape_page: {url}")
    try:
        page = await fetch_page(url)
    except Exception as e:
        log.warning(f"agent tool: fetch_page raised {type(e).__name__} for {url}: {e}")
        if failed is not None:
            failed.add(norm_url)
        return {"error": f"Fetch error: {e}"}
    if not page:
        if failed is not None:
            failed.add(norm_url)
        if _normalize_host(domain) in cf_blocked_domains:
            log.warning(f"agent tool: CF-blocked on fetch {url}")
            return {"error": "CF-blocked", "cf_blocked": True}
        log.warning(f"agent tool: fetch failed {url}")
        return {"error": "Failed to fetch URL"}

    visited.append(norm_url)
    base_url = get_base_url(url)

    raw_html = page.html_content or ""
    raw_text = str(page.get_all_text())
    cf_obfuscated_emails = [el.attrib.get("data-cfemail", "") for el in page.css("[data-cfemail]")]
    cf_protection_hrefs = [el.attrib.get("href", "") for el in page.css('a[href*="cdn-cgi/l/email-protection"]')]
    all_mailto_hrefs = [el.attrib.get("href", "") for el in page.css('a[href^="mailto:"]')]
    log.info(
        f"page raw_text_len={len(raw_text)} cf_obfuscated_emails={cf_obfuscated_emails} "
        f"cf_protection_hrefs={cf_protection_hrefs} all_mailto_hrefs={all_mailto_hrefs}"
    )
    log.info(f"page raw_text snippet: {raw_text[:600]!r}")

    page_social = extract_social_links(page)
    emails = extract_emails_from_text(raw_text)
    # Merge mailto: hrefs, decoded Cloudflare email-protection addresses; filter
    # placeholders and dedupe case-insensitively.
    emails_lower: set[str] = {e.lower() for e in emails}

    def _add_email(addr: str) -> None:
        if addr and "@" in addr and addr.lower() not in emails_lower and not _is_placeholder_email(addr):
            emails.append(addr)
            emails_lower.add(addr.lower())

    for el in page.css("a[href]"):
        href = el.attrib.get("href", "")
        if href.lower().startswith("mailto:"):
            _add_email(href[7:].split("?")[0].strip())

    for encoded in cf_obfuscated_emails:
        decoded = decode_cf_email(encoded)
        if decoded:
            _add_email(decoded)
    for href in cf_protection_hrefs:
        decoded = decode_cf_email(href)
        if decoded:
            _add_email(decoded)
    contact_form_url = find_contact_form_url(page, base_url)

    visited_set = set(visited)
    internal_links: list[str] = []
    seen: set[str] = set()
    for el in page.css("a"):
        href = el.attrib.get("href", "").strip()
        if not href or href.startswith(("mailto:", "#", "javascript:")):
            continue
        full = urljoin(base_url, href)
        parsed = urlparse(full)
        if not _host_matches_target(parsed.netloc, domain):
            continue
        # Preserve query string so ?page_id= navigation (old WordPress) is visible.
        path_part = parsed.path.rstrip("/") or "/"
        normalized = f"{parsed.scheme}://{parsed.netloc}{path_part}"
        if parsed.query:
            normalized += f"?{parsed.query}"
        if normalized in visited_set or normalized in seen:
            continue
        seen.add(normalized)
        internal_links.append(normalized)

    article_el = _first_el(page, "article", "main", '[role="main"]')
    raw = strip_html_attrs(article_el.html_content or "") if article_el else strip_html_attrs(page.html_content or "")

    author_hints = _extract_author_hints(page)
    email_name_pairs = _extract_email_name_pairs(page)

    all_anchors = page.css("a")
    log.info(f"agent tool page stats: total_anchors={len(all_anchors)} raw_markdown_len={len(raw)} html_len={len(page.html_content or '')}")
    log.info(f"agent tool page_markdown snippet: {raw[:500]!r}")

    result = {
        "url": url,
        "emails": emails,
        "social_links": page_social,
        "contact_form_url": contact_form_url,
        "page_markdown": raw[:4000],
        "internal_links": internal_links[:20],
    }

    if author_hints["names"]:
        result["author_hints"] = author_hints["names"]
    if author_hints["urls"]:
        result["author_url"] = author_hints["urls"][0]
    if email_name_pairs:
        result["email_name_pairs"] = email_name_pairs

    log.info(
        f"agent tool result: emails={emails} author_hints={author_hints} email_name_pairs={email_name_pairs} "
        f"socials={list(page_social.keys())} contact_form={contact_form_url!r} "
        f"internal_links_available={len(internal_links)}"
    )
    return result


_PRIORITY_PATH_PATTERNS = [
    re.compile(r"/author/", re.IGNORECASE),
    re.compile(r"/(team|about-us|about|people|our-team|staff|editorial-team|contributors)/?$", re.IGNORECASE),
    re.compile(r"/(press|media-kit)/?$", re.IGNORECASE),
]

_PRE_CRAWL_PAGE_BUDGET = 2  # extra pages fetched deterministically before the LLM loop starts


def _rank_candidate_urls(internal_links: list[str], author_url: str | None) -> list[str]:
    """Order candidate URLs by expected personal-email yield: author profile first,
    then team/about pages, then press/media-kit. Feeds the deterministic pre-crawl (A9)."""
    ranked: list[str] = []
    if author_url and author_url not in ranked:
        ranked.append(author_url)
    for pattern in _PRIORITY_PATH_PATTERNS:
        for link in internal_links:
            if link not in ranked and pattern.search(urlparse(link).path):
                ranked.append(link)
    return ranked


async def run_agent_scrape(url: str, helpers: dict) -> AgentScrapeResponse:
    base_url = helpers["get_base_url"](url)
    domain = urlparse(base_url).netloc
    log.info(f"agent-scrape start: url={url} domain={domain} model={MODEL}")

    client = AsyncOpenAI(
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url="https://openrouter.ai/api/v1",
    )

    visited_urls: list[str] = []
    failed_urls: set[str] = set()
    pages_scraped = 0
    seen_socials: dict[str, str] = {}  # accumulates socials actually seen during crawl
    seen_author_hints: list[str] = []
    seen_author_urls: list[str] = []
    seen_pairs: list[dict] = []
    pre_crawl_contact_form: str | None = None
    deadline = time.monotonic() + AGENT_BUDGET_SECONDS

    def _merge_page_result(res: dict) -> None:
        nonlocal pre_crawl_contact_form
        seen_socials.update(res.get("social_links") or {})
        for hint in res.get("author_hints") or []:
            if hint not in seen_author_hints:
                seen_author_hints.append(hint)
        author_url = res.get("author_url")
        if author_url and author_url not in seen_author_urls:
            seen_author_urls.append(author_url)
        pair_emails = {p["email"].lower() for p in seen_pairs}
        for pair in res.get("email_name_pairs") or []:
            if pair["email"].lower() not in pair_emails:
                seen_pairs.append(pair)
                pair_emails.add(pair["email"].lower())
        if not pre_crawl_contact_form and res.get("contact_form_url"):
            pre_crawl_contact_form = res["contact_form_url"]

    # --- A9: deterministic seeding — crawl the highest-yield pages (author profile,
    # /team, /about, ...) before the LLM spends iterations discovering them itself.
    # Results are replayed into the conversation as prior tool calls (below) so the
    # LLM still sees full page content for bio/context — it never loses information
    # it would have gotten by fetching these pages itself, it just doesn't have to
    # spend iterations deciding to visit them.
    collected_emails: list[str] = []
    collected_emails_lower: set[str] = set()
    precrawled_results: list[tuple[str, dict]] = []

    def _collect_emails(vals: list[str]) -> None:
        for v in vals:
            if v.lower() not in collected_emails_lower:
                collected_emails_lower.add(v.lower())
                collected_emails.append(v)

    seed_result = await _execute_scrape_page(url, domain, visited_urls, helpers, failed_urls)
    if "error" not in seed_result:
        pages_scraped += 1
        _merge_page_result(seed_result)
        _collect_emails(seed_result.get("emails") or [])
        precrawled_results.append((url, seed_result))

        candidate_urls = _rank_candidate_urls(
            seed_result.get("internal_links") or [],
            seen_author_urls[0] if seen_author_urls else None,
        )
        pre_crawl_remaining = min(_PRE_CRAWL_PAGE_BUDGET, MAX_PAGES - pages_scraped)
        for candidate in candidate_urls:
            if pre_crawl_remaining <= 0 or time.monotonic() >= deadline:
                break
            if any(_is_personal(e) for e in collected_emails):
                break  # already have a personal email, stop spending pre-crawl budget
            res = await _execute_scrape_page(candidate, domain, visited_urls, helpers, failed_urls)
            if "error" in res:
                continue
            pages_scraped += 1
            pre_crawl_remaining -= 1
            _merge_page_result(res)
            _collect_emails(res.get("emails") or [])
            precrawled_results.append((candidate, res))

    finish_result: dict | None = None

    messages: list[dict] = [
        {
            "role": "system",
            "content": (
                f"You are a contact enrichment agent for link building outreach. Target domain: {domain}\n\n"
                "PRIMARY GOAL: Find the article author's personal email and contact info.\n"
                "FALLBACK GOAL: If no article author, find the site owner/founder.\n\n"
                "Priority order:\n"
                "1. If the first page has an article author — that person IS your target. Find their email.\n"
                "2. Look for their personal profile page (e.g. /about/team/name, /author/name)\n"
                "3. Only look for founders/directors if no article author was found\n\n"
                "Rules:\n"
                f"- Use scrape_page to explore the site (max {MAX_PAGES} pages)\n"
                "- Generic emails (info@, contact@, hello@, support@, enquiries@, team@, mail@, office@) are last resort — do NOT stop if you only found one\n"
                "- Personal email = prefix is a first name or first.last (e.g. maxine@ or maxine.bremner@) — always try to find one\n"
                "- If you only found a generic email: visit the author's profile page and /contact before calling finish\n"
                "- When calling finish(), set type='personal' for personal emails and type='general' for generic inbox emails\n"
                "- Stop early ONLY if you have a personal email\n"
                "- If any page returns {\"cf_blocked\": true}, the entire domain is protected by Cloudflare bot management — call finish() immediately with null/empty data, do not try other pages\n"
                "- Call finish() with the best data found\n"
                "- ALWAYS return name and bio fields in English, regardless of the site's language\n"
                "- name must be a real human person's name only — NEVER a company, brand, platform name, or description of an error/access failure. If you cannot identify a real person, set name to null\n"
                "- If a page returns an error (WordPress error, database error, 404, 500, access denied, timeout), treat it as empty and do not describe the error in any field — set name to null"
            ),
        },
        {
            "role": "user",
            "content": f"Find contact info for the article author (or site owner if no author). Start at: {url}",
        },
    ]

    if precrawled_results:
        replay_tool_calls = [
            {
                "id": f"precrawl-{i}",
                "type": "function",
                "function": {"name": "scrape_page", "arguments": json.dumps({"url": page_url})},
            }
            for i, (page_url, _res) in enumerate(precrawled_results)
        ]
        messages.append({"role": "assistant", "tool_calls": replay_tool_calls})
        for i, (_page_url, res) in enumerate(precrawled_results):
            messages.append({"role": "tool", "tool_call_id": f"precrawl-{i}", "content": json.dumps(res)})

    for iteration in range(MAX_PAGES + 3):
        if time.monotonic() >= deadline:
            log.warning(f"agent: wall-clock budget ({AGENT_BUDGET_SECONDS}s) exceeded at iteration {iteration + 1}, stopping")
            break

        tools = [_SCRAPE_PAGE_TOOL, _FINISH_TOOL] if pages_scraped < MAX_PAGES else [_FINISH_TOOL]

        log.info(
            f"agent iteration {iteration + 1}: pages_scraped={pages_scraped}/{MAX_PAGES} "
            f"tools={[t['function']['name'] for t in tools]}"
        )

        try:
            resp = await asyncio.wait_for(
                client.chat.completions.create(
                    model=MODEL,
                    messages=messages,
                    tools=tools,
                    tool_choice="required",
                    temperature=0,
                    max_tokens=2048,
                    timeout=MODEL_CALL_TIMEOUT_SECONDS,
                ),
                timeout=MODEL_CALL_TIMEOUT_SECONDS,
            )
        except Exception as e:
            log.warning(f"agent: primary model failed ({type(e).__name__}: {e}), retrying with fallback {FALLBACK_MODEL}")
            if time.monotonic() >= deadline:
                log.warning("agent: budget exceeded before fallback attempt, stopping with data gathered so far")
                break
            try:
                resp = await asyncio.wait_for(
                    client.chat.completions.create(
                        model=FALLBACK_MODEL,
                        messages=messages,
                        tools=tools,
                        tool_choice="required",
                        temperature=0,
                        max_tokens=2048,
                        timeout=MODEL_CALL_TIMEOUT_SECONDS,
                    ),
                    timeout=MODEL_CALL_TIMEOUT_SECONDS,
                )
            except Exception as e2:
                log.error(f"agent: fallback model also failed ({type(e2).__name__}: {e2}), stopping with data gathered so far")
                break

        if not resp.choices:
            log.error("agent: model response had no choices (malformed 200), stopping with data gathered so far")
            break

        msg = resp.choices[0].message
        tool_names = [tc.function.name for tc in (msg.tool_calls or [])]
        if len(tool_names) > 5:
            log.warning(f"agent response: model returned {len(tool_names)} tool calls — likely hallucination, will use first finish only")
        log.info(f"agent response: finish_reason={resp.choices[0].finish_reason} tool_calls={tool_names}")

        if not msg.tool_calls:
            log.warning(f"agent: no tool calls returned, retrying with {EMPTY_RESPONSE_FALLBACK_MODEL} fallback")
            if time.monotonic() >= deadline:
                log.warning("agent: budget exceeded before empty-response fallback, stopping with data gathered so far")
            else:
                try:
                    resp = await asyncio.wait_for(
                        client.chat.completions.create(
                            model=EMPTY_RESPONSE_FALLBACK_MODEL,
                            messages=messages,
                            tools=tools,
                            tool_choice="required",
                            temperature=0,
                            max_tokens=2048,
                            timeout=MODEL_CALL_TIMEOUT_SECONDS,
                        ),
                        timeout=MODEL_CALL_TIMEOUT_SECONDS,
                    )
                    if not resp.choices:
                        log.error("agent: empty-response fallback returned no choices (malformed 200), stopping with data gathered so far")
                    else:
                        msg = resp.choices[0].message
                        tool_names = [tc.function.name for tc in (msg.tool_calls or [])]
                        log.info(f"agent response (empty-retry): finish_reason={resp.choices[0].finish_reason} tool_calls={tool_names}")
                except Exception as e:
                    log.error(f"agent: empty-response fallback also failed ({type(e).__name__}: {e}), stopping with data gathered so far")

        # Append assistant turn to history
        assistant_entry: dict = {"role": "assistant"}
        if msg.content:
            assistant_entry["content"] = msg.content
        if msg.tool_calls:
            assistant_entry["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in msg.tool_calls
            ]
        messages.append(assistant_entry)

        if not msg.tool_calls:
            log.warning("agent: no tool calls returned, stopping")
            break

        called_finish = False
        for tc in msg.tool_calls:
            fn = tc.function.name
            try:
                args = json.loads(tc.function.arguments)
            except Exception as e:
                log.warning(f"agent: failed to parse args for {fn}: {e}")
                args = {}

            log.info(f"agent executing: {fn}({list(args.keys())})")

            if fn == "scrape_page":
                if time.monotonic() >= deadline:
                    log.warning(f"agent: budget exceeded before scrape_page, skipping {args.get('url')}")
                    messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps({"error": "Budget exceeded"})})
                    continue
                tool_result = await _execute_scrape_page(
                    url=args.get("url", ""),
                    domain=domain,
                    visited=visited_urls,
                    helpers=helpers,
                    failed=failed_urls,
                )
                if "error" not in tool_result:
                    pages_scraped += 1
                    _merge_page_result(tool_result)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(tool_result),
                })

            elif fn == "finish":
                raw_e = args.get('emails') or []
                email_summary = [f"{e.get('value')}({e.get('type')})" if isinstance(e, dict) else e for e in raw_e]
                log.info(f"agent finish: name={args.get('name')!r} emails={email_summary} bio_len={len(args.get('bio') or '')}")
                finish_result = args
                called_finish = True
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": "Done.",
                })
                break  # ignore any duplicate finish calls in same response

        if called_finish:
            break

    if not finish_result:
        log.warning("agent: loop ended without finish — empty result")
        finish_result = {}

    final_name = _clean_name(finish_result.get("name"))
    if not final_name:
        # Deterministic fallback: adopt the first valid human-looking hint the LLM missed/dropped.
        for hint in seen_author_hints:
            candidate = _clean_name(hint)
            if candidate:
                final_name = candidate
                log.info(f"agent: adopted deterministic author hint as name: {candidate!r}")
                break
    elif final_name != finish_result.get("name"):
        log.info(f"agent: name sanitized from {finish_result.get('name')!r} to {final_name!r}")
    raw_emails: list[dict] = finish_result.get("emails") or []
    final_bio = _clean_bio(finish_result.get("bio"))
    final_contact_form = finish_result.get("contact_form_url") or pre_crawl_contact_form

    # Use deterministic _is_personal classifier instead of LLM's self-graded type.
    seen_e: set[str] = set()
    deduped: list[EmailEntry] = []
    for item in raw_emails:
        if not isinstance(item, dict):
            continue
        val = item.get("value", "")
        if val and val.lower() not in seen_e:
            if _is_placeholder_email(val):
                log.info(f"agent: dropping placeholder email {val!r}")
                continue
            seen_e.add(val.lower())
            typ = "personal" if _is_personal(val) else "general"
            deduped.append(EmailEntry(value=val, type=typ))

    # Cross-check: only keep social links actually seen during the crawl.
    # Drops hallucinated LinkedIn/Twitter URLs that never appeared on the site.
    raw_socials = finish_result.get("social_links")
    if raw_socials and not isinstance(raw_socials, dict):
        log.warning(f"agent: social_links came back as {type(raw_socials).__name__}, not object — ignoring: {raw_socials!r}")
    llm_socials: dict = raw_socials if isinstance(raw_socials, dict) else {}
    final_social: dict = {}
    for platform, link in llm_socials.items():
        if platform in seen_socials:
            final_social[platform] = seen_socials[platform]
        else:
            log.info(f"agent: dropping hallucinated social {platform}={link!r} (not seen in crawl)")
    # Merge any socials we found during crawl that the LLM didn't include.
    for platform, link in seen_socials.items():
        if platform not in final_social:
            final_social[platform] = link

    confidence = _confidence(final_name, deduped)

    log.info(
        f"agent-scrape done: name={final_name!r} emails={[e.value for e in deduped]} "
        f"confidence={confidence} bio={'yes' if final_bio else 'no'} "
        f"pages_visited={len(visited_urls)}"
    )

    return AgentScrapeResponse(
        name=final_name,
        emails=deduped,
        social_links=final_social,
        bio=final_bio,
        contact_form_url=final_contact_form,
        confidence=confidence,
        visited_urls=visited_urls,
        author_hints=seen_author_hints,
        author_url=seen_author_urls[0] if seen_author_urls else None,
        known_pairs=[NamedEmail(**p) for p in seen_pairs],
    )
