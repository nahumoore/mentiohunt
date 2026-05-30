# Contact Enrichment — Name + Email Scraping Service

Goal: given an article URL, find the name and email of the person who created it.

> **Status:** scraping service built at `apps/scraper`. FastAPI + Scrapling. Deployed via Railway pointing to that subdirectory. Handles steps 1–2 below (scrape article + site pages). Steps 3–5 (email pattern generation + Apify validation) handled by main server app.

> Skill available for scrapling!

---

## Waterfall

### 1. Scrape the article page

Look for:

- Author byline (name visible on page)
- Author profile link → follow it and scrape name + social links
- `<meta name="author">` tag
- Schema.org `Person` or `Article` markup (`author.name`)
- Open Graph tags (sometimes include author)

**Result:** name found or not found.

---

### 2. Scrape site-level pages

If no name from article, try:

- `/about`
- `/contact`
- `/team`

Look for a person's name + any email directly listed.

**Result:** name found, email found directly, or nothing.

---

### 3. Generate email patterns

If name found (`John Doe`) + domain (`example.com`), generate:

- `john@example.com`
- `johndoe@example.com`
- `john.doe@example.com`
- `j.doe@example.com`
- `jdoe@example.com`
- `doe@example.com`

If no name found, generate generic patterns:

- `contact@example.com`
- `hello@example.com`
- `hi@example.com`
- `info@example.com`

---

### 4. Validate emails via Apify

Send generated patterns to Apify email validation actor.
Store first pattern that passes as the contact email.
Store confidence level: `personalized` vs `generic`.

---

### 5. Surface result

Attach to opportunity:

- Name (if found)
- Email (if validated)
- Confidence: `email` > `generic-email` > `contact-form-url` > `none`

Never block opportunity creation — enrich async, update when done.

---

## Situations to Handle

### Personal blog (WordPress, Ghost, Substack)

- Almost always has byline + author page
- Substack has clear author profile with name
- Easy case

### Company/SaaS blog

- Byline may exist but person isn't the decision-maker
- Target may be founder or marketing lead, not the author
- Scrape About/Team page for founder or head of marketing name
- Use that name for email pattern generation

### Niche/affiliate site

- Often no byline, no team page
- WHOIS privacy on
- Generate generic patterns only
- Low confidence result — score opportunity lower

### News/media site

- Has byline but author doesn't control what gets linked
- Flag these as `media` type — outreach target is editorial team, not author
- Use `editor@`, `tips@`, `contact@` generic patterns

### Guest post on someone else's blog

- Byline is the guest author, not the site owner
- Site owner controls the link, not the author
- Scrape site owner separately from About page

### No byline, no about page, contact form only

- Store contact form URL as fallback
- Surface to user as manual outreach needed
