# Known issue: unvalidated LLM tool-call JSON crashes `/check-mention` when `name` comes back as a list

## Summary

`apps/scraper/agent_enrich.py:52` (`_clean_name`) calls `trimmed = name.strip()` on the `name` field of the agent's `finish` tool call. Observed on `/check-mention` during the 2026-07-23 07:00 UTC window (task `check-mention-9a6ddecc`, `clutch.co`):

```
ERROR:    Exception in ASGI application
INFO:     100.64.0.19:46524 - "POST /check-mention HTTP/1.1" 500 Internal Server Error
AttributeError: 'list' object has no attribute 'strip'
```

## Root cause

`agent_enrich.py:770` parses the LLM's tool-call arguments straight from `json.loads(tc.function.arguments)` with no schema validation. `agent_enrich.py:818` calls `_clean_name(finish_result.get("name"))`, where `finish_result` is that unvalidated dict. `_clean_name` (`agent_enrich.py:50-52`) only checks truthiness before calling `.strip()`:

```python
if name:              # a non-empty list is truthy too
    trimmed = name.strip()   # crashes if name is ["Jane Doe"] instead of "Jane Doe"
```

If the model emits `"name": ["Jane Doe"]` (a known LLM tool-schema-adherence failure — arrays instead of scalars) rather than a plain string, `name` passes the truthiness check and the whole request crashes on `.strip()`, taking down the entire `/check-mention` call rather than just discarding a malformed field.

This same request (`check-mention-9a6ddecc`) also hit the stealthy-tier proxy bug (`2026-07-23-stealthy-proxy-rotation-not-initialized.md`) on a `scrape_page` sub-fetch to `help.clutch.co/contact-us` moments earlier, via the shared `fetch_page` escalation chain (`core.py:646-658` seeds it as an agent tool). The two are independent bugs that happened to chain in one task — not the same root cause, not a causal link between them.

## Impact

Not a silent drop like the other scraper tickets — this one is a hard 500 on `/check-mention`. Caller-side (`apps/server/.../unlinked-mention/check-mention-client.ts:38-40`) treats any non-2xx as a transport failure: logs a warn and returns `null`, so the candidate is dropped the same as any other check-mention failure — no crash propagates further up, but the opportunity for that URL is lost same as the proxy-rotation bug's downstream effect. Frequency is lower than the proxy bug (LLM has to specifically hallucinate a list for `name`), but each occurrence is a full request failure, not a partial one.

## Recommendation (not yet actioned)

- Validate `finish_result` against a schema (or at minimum coerce/type-check each field) right after `json.loads` at `agent_enrich.py:770`, before any field is used — reject or coerce non-string `name`/similar fields instead of trusting LLM tool-call shape.
- Narrower fix if a full schema validator is overkill: change `_clean_name`'s truthiness check to `if isinstance(name, str) and name:` so a list (or any non-string) is treated as absent rather than crashing.
- Same unvalidated-LLM-output pattern flagged in `2026-07-22-competitor-domain-hallucination.md` (Zod shape-only checks, no content validation) — worth a shared convention rather than a one-off fix here.
