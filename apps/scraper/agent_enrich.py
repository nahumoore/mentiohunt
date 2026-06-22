import json
import logging
import os
from urllib.parse import urljoin, urlparse

from openai import OpenAI
from pydantic import BaseModel

log = logging.getLogger("scraper")

MODEL = "deepseek/deepseek-v4-pro"
FALLBACK_MODEL = "google/gemini-2.5-flash"
MAX_PAGES = 6

_GENERIC_PREFIXES = {"noreply", "no-reply", "support", "team", "hello", "info", "contact", "admin", "enquiries", "enquiry", "mail", "office", "sales", "marketing", "press", "media", "billing", "accounts", "hr", "jobs", "careers", "legal", "privacy", "abuse", "postmaster", "webmaster", "newsletter", "notifications"}

_PLACEHOLDER_EMAIL_DOMAINS = {"example.com", "example.org", "example.net", "test.com", "domain.com", "email.com", "yourdomain.com", "sample.com", "acme.com", "placeholder.com", "fakeemail.com"}

_NAME_BLOCKLIST = {"null", "none", "n/a", "na", "undefined", "unknown", "finish", "scrape_page", "anonymous", "author", "admin", "editor", "staff", "team"}


def _clean_name(name: str | None) -> str | None:
    """Sanitize LLM-produced contact name; returns None for garbage values."""
    if not name:
        return None
    trimmed = name.strip()
    if not trimmed or len(trimmed) > 60:
        return None
    if not any(c.isalpha() for c in trimmed):
        return None
    if trimmed.lower() in _NAME_BLOCKLIST:
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
                "name": {"type": "string", "description": "Cleaned full name of the article author or site founder/owner — must be a real human person's name (e.g. 'John Smith'). NEVER set this to a company name, brand name, or platform name. If no individual person is identified, set to null."},
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


class AgentScrapeResponse(BaseModel):
    name: str | None
    emails: list[EmailEntry]
    social_links: dict[str, str]
    bio: str | None
    contact_form_url: str | None
    confidence: str  # "personalized" | "email-only" | "generic" | "none"
    visited_urls: list[str]


def _is_personal(email: str) -> bool:
    prefix = email.split("@")[0].lower()
    return not any(p in prefix for p in _GENERIC_PREFIXES)


def _confidence(name: str | None, emails: list[EmailEntry]) -> str:
    if name and any(e.type == "personal" for e in emails):
        return "personalized"
    if emails:
        return "email-only"
    if name:
        return "generic"
    return "none"


def _execute_scrape_page(url: str, domain: str, visited: list[str], helpers: dict) -> dict:
    fetch_page = helpers["fetch_page"]
    extract_social_links = helpers["extract_social_links"]
    extract_emails_from_text = helpers["extract_emails_from_text"]
    get_base_url = helpers["get_base_url"]
    strip_html_attrs = helpers["strip_html_attrs"]
    _first_el = helpers["_first_el"]
    find_contact_form_url = helpers["find_contact_form_url"]

    if urlparse(url).netloc != domain:
        log.warning(f"agent tool: blocked external URL {url}")
        return {"error": f"URL must be on {domain}"}

    if url in visited:
        log.warning(f"agent tool: already visited {url}")
        return {"error": "Already visited this URL"}

    log.info(f"agent tool scrape_page: {url}")
    page = fetch_page(url)
    if not page:
        log.warning(f"agent tool: fetch failed {url}")
        return {"error": "Failed to fetch URL"}

    visited.append(url)
    base_url = get_base_url(url)

    page_social = extract_social_links(page)
    emails = extract_emails_from_text(str(page.get_all_text()))
    for el in page.css("a[href]"):
        href = el.attrib.get("href", "")
        if href.lower().startswith("mailto:"):
            addr = href[7:].split("?")[0].strip()
            if addr and "@" in addr and addr not in emails:
                emails.append(addr)
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
        if parsed.netloc != domain:
            continue
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/") or f"{parsed.scheme}://{parsed.netloc}/"
        if normalized in visited_set or normalized in seen:
            continue
        seen.add(normalized)
        internal_links.append(normalized)

    article_el = _first_el(page, "article", "main", '[role="main"]')
    raw = strip_html_attrs(article_el.html_content or "") if article_el else strip_html_attrs(page.html_content or "")

    result = {
        "url": url,
        "emails": emails,
        "social_links": page_social,
        "contact_form_url": contact_form_url,
        "page_markdown": raw[:4000],
        "internal_links": internal_links[:20],
    }

    log.info(
        f"agent tool result: emails={emails} "
        f"socials={list(page_social.keys())} contact_form={contact_form_url!r} "
        f"internal_links_available={len(internal_links)}"
    )
    return result


def run_agent_scrape(url: str, helpers: dict) -> AgentScrapeResponse:
    base_url = helpers["get_base_url"](url)
    domain = urlparse(base_url).netloc
    log.info(f"agent-scrape start: url={url} domain={domain} model={MODEL}")

    client = OpenAI(
        api_key=os.environ["OPENROUTER_API_KEY"],
        base_url="https://openrouter.ai/api/v1",
    )

    visited_urls: list[str] = []
    pages_scraped = 0

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
                "- Call finish() with the best data found\n"
                "- ALWAYS return name and bio fields in English, regardless of the site's language\n"
                "- name must be a real human person's name only — NEVER a company, brand, or platform name. If you cannot identify a real person, set name to null"
            ),
        },
        {
            "role": "user",
            "content": f"Find contact info for the article author (or site owner if no author). Start at: {url}",
        },
    ]

    finish_result: dict | None = None

    for iteration in range(MAX_PAGES + 3):
        tools = [_SCRAPE_PAGE_TOOL, _FINISH_TOOL] if pages_scraped < MAX_PAGES else [_FINISH_TOOL]

        log.info(
            f"agent iteration {iteration + 1}: pages_scraped={pages_scraped}/{MAX_PAGES} "
            f"tools={[t['function']['name'] for t in tools]}"
        )

        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=tools,
                tool_choice="required",
                temperature=0,
                max_tokens=2048,
                timeout=90,
            )
        except Exception as e:
            log.warning(f"agent: primary model failed ({e}), retrying with fallback {FALLBACK_MODEL}")
            resp = client.chat.completions.create(
                model=FALLBACK_MODEL,
                messages=messages,
                tools=tools,
                tool_choice="required",
                temperature=0,
                max_tokens=2048,
                timeout=90,
            )

        msg = resp.choices[0].message
        tool_names = [tc.function.name for tc in (msg.tool_calls or [])]
        if len(tool_names) > 5:
            log.warning(f"agent response: model returned {len(tool_names)} tool calls — likely hallucination, will use first finish only")
        log.info(f"agent response: finish_reason={resp.choices[0].finish_reason} tool_calls={tool_names}")

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
                tool_result = _execute_scrape_page(
                    url=args.get("url", ""),
                    domain=domain,
                    visited=visited_urls,
                    helpers=helpers,
                )
                pages_scraped += 1
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
    if final_name != finish_result.get("name"):
        log.info(f"agent: name sanitized from {finish_result.get('name')!r} to {final_name!r}")
    raw_emails: list[dict] = finish_result.get("emails") or []
    final_social: dict = finish_result.get("social_links") or {}
    final_bio = finish_result.get("bio")
    final_contact_form = finish_result.get("contact_form_url")

    seen_e: set[str] = set()
    deduped: list[EmailEntry] = []
    for item in raw_emails:
        if not isinstance(item, dict):
            continue
        val = item.get("value", "")
        typ = item.get("type", "general")
        if val and val not in seen_e:
            if _is_placeholder_email(val):
                log.info(f"agent: dropping placeholder email {val!r}")
                continue
            seen_e.add(val)
            deduped.append(EmailEntry(value=val, type=typ))

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
    )
