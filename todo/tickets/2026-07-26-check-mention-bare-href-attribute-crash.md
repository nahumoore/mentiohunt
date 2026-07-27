# Known issue: bare HTML `href` attribute crashes `/check-mention` with unhandled `AttributeError`

## Summary

`apps/scraper/routes/check_mention.py:73` (`_run_check_mention` → `run_agent_scrape`) crashed
with an unhandled `AttributeError: 'NoneType' object has no attribute 'strip'`, returning
`500 Internal Server Error` to the caller. Observed 2026-07-26T19:00:57Z on Railway
(`scraping` service, deployment `b9e5f498-1d06-400b-bef7-8466b24a2869`), request
`POST /check-mention` for `https://news.illinois.edu/author/jeheckel/` (`check-mention-b306a76d`).

Full traceback:

```
File "/app/routes/check_mention.py", line 37, in check_mention
  return await _run_check_mention(request)
File "/app/routes/check_mention.py", line 73, in _run_check_mention
  contact = await run_agent_scrape(url=request.url, helpers=helpers)
File "/app/agent_enrich.py", line 598, in run_agent_scrape
  seed_result = await _execute_scrape_page(url, domain, visited_urls, helpers, failed_urls)
File "/app/agent_enrich.py", line 490, in _execute_scrape_page
  raw = strip_html_attrs(article_el.html_content or "") if article_el else strip_html_attrs(page.html_content or "")
File "/app/core.py", line 364, in strip_html_attrs
  p.feed(raw)
File "/usr/local/lib/python3.12/html/parser.py", line 447, in parse_starttag
  self.handle_starttag(tag, attrs)
File "/app/core.py", line 324, in handle_starttag
  self._current_href = dict(attrs).get("href", "").strip() or None
AttributeError: 'NoneType' object has no attribute 'strip'
```

## Root cause

`apps/scraper/core.py:324`, inside `_TextLinksExtractor.handle_starttag` (the HTML-parser
subclass used by `strip_html_attrs`, `core.py:362-365`):

```python
self._current_href = dict(attrs).get("href", "").strip() or None
```

Python's stdlib `html.parser.HTMLParser` calls `handle_starttag(tag, attrs)` with `attrs` as a
list of `(name, value)` tuples — and for a **valueless attribute** (e.g. `<a href>` with no
`=value`, which is valid HTML), `value` is `None`, not an empty string. `dict.get("href", "")`
only falls back to the default `""` when the key is **absent**; here the key `"href"` is
present with value `None`, so `.get()` returns `None` — and `.strip()` on `None` raises.

This is a classic `dict.get(key, default)` gotcha: the default only guards a missing key, not
an existing key mapped to a falsy/`None` value. The scraped page's HTML apparently contained
at least one bare `href` attribute, which is enough to crash the entire parse.

## Impact

One-off per-request failure, not a cascade — only the single `/check-mention` call for the
page containing the bare `href` fails, returning 500 to the Node caller (`apps/server`) and
losing that contact-enrichment result. Silent data loss shape (no contact surfaced for that
URL), same category as other "unhandled exception drops one unit of work" issues. Likely
recurring at low frequency — any scraped page with a bare `href` attribute anywhere in its
HTML (not just on the qualifying mention link) will trigger it, since `_TextLinksExtractor`
walks every tag in the document, not just the relevant one.

## Recommendation (not yet actioned)

- Fix at `core.py:324`: use `(dict(attrs).get("href") or "").strip() or None` instead of
  `dict(attrs).get("href", "").strip()`, so a `None` value is coerced to `""` before
  `.strip()` regardless of whether the key was missing or present-but-`None`.
- Same pattern may exist elsewhere in `core.py`/`agent_enrich.py` wherever `dict(attrs).get(...)`
  or `el.attrib.get(...)` is followed directly by `.strip()` without an `or ""` guard — worth a
  quick audit of the other `.strip()` call sites in `agent_enrich.py` (e.g. lines 270, 282-283,
  456, 472) since several follow the same `.get(key, "")` shape and could have the same gap if
  the underlying attribute source ever yields `None` for a present key.
