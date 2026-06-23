---
name: internal-linker
description: >
  Adds SEO-optimized internal links to a single MDX resource file under apps/web/resources/.
  Use this skill whenever the user asks to "add internal links", "improve internal linking", 
  "link between pages", "add links to [page name]", or mentions internal linking in the context 
  of the Mentiohunt content. Also trigger it proactively when the user asks you to improve SEO 
  on a resource page — internal linking is part of on-page SEO.
---

# Internal Linker

Adds contextually placed, SEO-optimized internal links to a single MDX file in `apps/web/resources/`.

## URL map

The MDX files live in `apps/web/resources/` but render under different URL prefixes:

| Directory | URL prefix | Example |
|---|---|---|
| `resources/articles/{slug}.mdx` | `/blog/{slug}` | `/blog/saas-backlink-building` |
| `resources/backlinks-from/{slug}.mdx` | `/backlinks-from/{slug}` | `/backlinks-from/reddit` |
| `resources/alternatives/{slug}.mdx` | `/alternatives/{slug}` | `/alternatives/best-pitchbox-alternative-for-founders` |
| `resources/compare/{slug}.mdx` | `/compare/{slug}` | `/compare/buzzstream-vs-pitchbox` |
| `resources/free-tools/{slug}.mdx` | `/free-tools/{slug}` | `/free-tools/competitor-backlink-gap` |

The slug is the filename without `.mdx`. If the frontmatter has a `slug:` field, use that; otherwise use the filename.

Hub pages (index routes): `/backlinks-from`, `/free-tools`, `/compare`, `/alternatives` — link to these when the context calls for "browsing more options in a category."

## Process

### Step 1: Read the target file

Read the full MDX file the user specifies. Note:
- Its URL (directory + slug → URL prefix above)
- Its topic and audience intent
- Any internal links that already exist (so you don't duplicate them)

### Step 2: Build the resource map

Run this command to list all available resource files:

```bash
find apps/web/resources -name "*.mdx" -type f | sort
```

For each file, derive its URL using the map above. Read the frontmatter (`title`, `description`) of each file — use `grep -A5 "^---" <file>` or a quick `head -10` to get title/description without loading full content.

Build a mental map: `{ url, title, description, topic_signals }` for every linkable page.

### Step 3: Find link opportunities

Scan the target file body (not frontmatter) for phrases where an internal link would:
1. Give the reader a natural next step — they'd actually want to follow it
2. Be placed in a sentence that already covers the linked page's topic — no filler bridging needed

**Priority order for link targets** (link to higher-priority pages when there's a choice):
1. Free tools (`/free-tools/*`) — high utility, drives engagement
2. Alternatives pages (`/alternatives/*`) — commercial intent, conversion value
3. Compare pages (`/compare/*`) — commercial intent
4. Other articles (`/blog/*`) — topical depth
5. Backlinks-from pages (`/backlinks-from/*`) — supporting context
6. Hub pages (`/backlinks-from`, `/free-tools`, etc.) — only when listing multiple options

### Step 4: Select and anchor

For each link opportunity selected:
- **Find the exact phrase** in the existing prose that should become the anchor text
- The phrase must already be in the sentence — never insert new words just to create an anchor
- The phrase should describe what the linked page is about, not what the reader should do

**Good anchor patterns:**
- `[competitor backlink gap analysis](/free-tools/competitor-backlink-gap)` — names the thing
- `[backlink price calculator](/free-tools/backlink-price-calculator)` — names the tool
- `[Pitchbox alternative for founders](/alternatives/best-pitchbox-alternative-for-founders)` — describes the page
- `[how to find backlink opportunities](/blog/how-to-find-backlink-opportunities)` — describes the content

**Never use these anchors:**
- "check this guide", "read this", "this article", "this page", "click here", "learn more", "find out more", "see here", "view the full", "explore more"
- Generic phrases like "more information", "additional resources", "related content"
- Verb phrases like "click to see", "visit to learn"

### Step 5: Apply limits

- **Max 5–7 new internal links per file** (regardless of file length) — quality over quantity
- **No duplicate destinations**: if `/free-tools/competitor-backlink-gap` is already linked once, don't add a second link to it
- **No self-links**: never link a page to itself
- **Skip frontmatter, code blocks, and existing link syntax** — only modify prose body
- **Skip the first paragraph** — let the article open without an immediate detour
- **Don't link every mention of a topic** — one link per destination is enough, pick the best placement

### Step 6: Propose, then apply

Before editing the file, output a proposal in this format:

```
## Proposed internal links for [filename]

1. **Anchor:** "[anchor text]"
   **URL:** /path/to/page
   **Context:** "[...surrounding sentence fragment...]"
   **Why:** one-sentence rationale

2. ...
```

After listing all proposals, apply each one using the Edit tool — replace the exact prose with the markdown link syntax. Make no other changes to the file.

If a proposed link can't be found exactly in the file (e.g., the phrase changed), skip it and note why.

## Anchor text tone

This site's content is direct and technical. Anchors should match that register — noun phrases work best. The goal is that a reader skimming the page understands what they'll get if they follow the link, purely from the anchor text. If the anchor text doesn't do that without surrounding sentence context, it's not the right anchor.
