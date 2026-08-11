# How We Built 15 Backlinks in 30 Days With Claude (Full Playbook)

Hello, I'm Nico, founder of Mentiohunt, a platform that automates backlink outreach and alerts you the moment a prospect replies.

Last month we sent **3,523 outreach emails**, got 107 replies, and secured 12 backlinks (from 50+ DR sites) for our customers.

For our own site (Mentiohunt), we landed 3 backlinks:

1. https://erikemanuelli.com/
2. https://techjustify.com/
3. https://saaslinkbuilder.com/

Here's everything we've learned from the outreach strategy we use for our sites and our customers.

## Step 1: Be prepared for when the train comes

When you match with a prospect and they're interested in collaborating with you, they'll ask for a keyword and an article to link to on your site, so you need to be prepared.

### 1. Choose a low competition keyword

Start by using Claude to suggest low competition keywords in your niche that you can actually rank for.

For example, in our case we found `automated link building tools` (medium search volume on Google, low competition), so we made that our principal keyword.

You can use DataForSEO or the Ahrefs MCP for this step to get better results. If you don't have either and prefer to keep things simpler, ask Claude to run a live SERP check to analyze the keyword and see who's currently ranking for it.

### 2. Create content for that keyword

Once you've found your keyword, create content for it. What you build depends on what Google thinks should rank for that keyword: a blog post, a free tool, etc.

E.g, search Google for the keyword, see what's currently ranking, then create something better. Don't just say Claude to build the whole thing without you researching first.

Make sure you have a solid internal linking strategy, so you're linking to this resource from your highest-traffic pages.

Also make sure it **gets indexed in Google** using GSC. If it's still not indexed 2 days after you submit it, that usually means the content doesn't match what Google is looking for.

Ask Claude to double-check the SERPs for your keyword and suggest content improvements.

## Step 2: Find the sites worth contacting

Once you have content worth linking to, the next problem is figuring out who'd actually want to link to it. Chasing high DR alone gets you a list of sites that will never say yes.

What you're really looking for is fit: a page where your link makes the page better, not just a domain with a good score. Plus, as higher the DR is, harder is to negotiate them.

Here are the four methods we lean on most. Run all four, every week:

- [ ] Unlinked mentions
- [ ] Competitor backlinks
- [ ] Resource pages and listicles
- [ ] Broken link building

### 1. Unlinked mentions

Some sites already talk about you, they just haven't linked. Search your product name in quotes, exclude your own domain, and scan for pages that mention you in the text.

Ask Claude to generate query variations: your product name plus common context terms like "review," "alternative," or "vs," plus likely misspellings.

Some examples:

- `mentiohunt -site:mentiohunt.com`
- `mentiohunt reviews -site:mentiohunt.com`
- `mentiohunt alternatives -site:mentiohunt.com`

Then check each result by hand. A real text mention worth a link looks very different from a passing screenshot.

### 2. Competitor backlinks

Pull a competitor's backlink list from Ahrefs or DataForSEO. Anyone already linking to a competitor has shown they're open to linking to tools like yours.

If you don't have these tools, you can use this free tool from Ahrefs: https://ahrefs.com/backlink-checker

The list will be long and mostly noise. Send it to Claude to filter it down to pages where the link actually makes sense:

- comparison posts
- "alternatives to X" roundups
- category pages

not random footer links or unrelated blog mentions.

### 3. Resource pages and listicles

Search things like "best [category] tools" or "[niche] resources" and variations on that phrasing.

Ask Claude to expand the query list using the language your niche actually uses, since readers and site owners don't always describe your category the way you do.

Check that each result is a genuinely curated list, not a random post that happens to name a few tools in passing. Curated lists are maintained, which means the owner is used to adding new entries.

### 4. Broken link building

Find dead links on pages related to your niche, either manually or with a broken-link checker extension- we built a free tool for this: https://mentiohunt.com/free-tools/broken-link-finder. Then pitch your content as the replacement.

This only works if your content genuinely fills the gap the dead link left. Don't force it onto a page where it's a stretch.

> ⚠️ **Pitfall:** forcing a broken-link pitch onto a page where your content doesn't actually fit kills trust with that site owner fast — and they talk to other site owners in their niche.

Do this properly across four methods, every week, for every keyword you're targeting, and you'll spend most of your time filtering noise instead of writing outreach. That repetitive part is exactly the piece we ended up automating.

## Step 3: Find the right contact

A domain isn't who you email. You need a person, and ideally the person who actually decides what gets linked, not a generic inbox nobody checks.

Start with the page itself. Check the author byline on the article you found, most blogs credit a real name. If there's no byline, check the site's About or Team page, founders and small teams usually list themselves there.

If neither gives you a name, ask Claude to check the site's footer and social links (Twitter/X, LinkedIn) for the founder or editor. Small SaaS and niche blogs are usually run by one or two people, so this is often faster than it sounds.

We also have a free tool for this, check it out here: https://mentiohunt.com/free-tools/author-contact-finder

Once you have a name, find their email. Check these in order:

- [ ] The author bio or About page (some list it directly)
- [ ] LinkedIn, search the name plus the company
- [ ] Hunter.io or a similar email finder, using the name and domain
- [ ] A WHOIS lookup on the domain, if the site is small and privacy isn't locked down

> 💡 **Tip:** skip the generic `info@` or `contact@` inbox if you can avoid it. Those get filtered, forwarded, or ignored.

## Step 4: What to offer

Nobody links to you just because you asked nicely. You need to make it worth their time. Here's what we usually offer, and why each one works.

- **A genuine review on Trustpilot or G2.** Costs you a few minutes, gives them real social proof they can point to. Works best when their product is actually good and you can write something honest.
- **A written testimonial for their site or landing page.** Similar idea, lighter lift. Great for smaller products still building trust with visitors.
- **A content collaboration or guest post swap.** You write for them, they write for you (or you link to each other's existing content). Works well with active blogs that publish regularly.
- **A shoutout on our social channels or newsletter.** Costs us nothing but attention, and it's genuinely valuable if your audience overlaps with theirs.

None of these are one-size-fits-all, so this is where you need to get creative. Some sites won't want any of them, and there's nothing else you can trade. That's when you're stuck with the last option: paying for the placement.

> 💡 **Tip:** always try to negotiate a collab, review, or swap first. They're free, and they usually work better than money anyway, since the site owner is choosing to feature you, not just cashing a check.

If a site genuinely won't budge and you're considering paying, don't just accept their asking price. Ask Claude to websearch the site (real traffic, actual audience engagement, any spam or PBN signals) and tell you if it's worth it.

You can also get a quick benchmark using our [backlink price calculator](https://mentiohunt.com/free-tools/backlink-price-calculator) before you negotiate a number.

## Step 5: Write the email, and the follow-ups

This is where most outreach falls apart, usually because the email reads like it was sent to five hundred people at once.

A few rules we stick to on every email, first contact or follow-up:

- [ ] **Keep it short.** 3 to 4 sentences, not a pitch deck. If they have to scroll, you've already lost them.
- [ ] **Prove you did the research.** Reference the specific page, the specific mention, the specific thing you noticed, not "I love your site" or "great content." That's the one thing a templated blast can't fake.
- [ ] **One clear ask.** Not three options crammed into one email. Pick the ask that fits this exact page.
- [ ] **Offer one thing, not the whole list.** Pick whichever item from your offerings actually fits this prospect, and only that one. A blogger with no product of their own doesn't want a Trustpilot review offer.
- [ ] **Sound human.** No "leverage," no "synergy," no "SEO" or "backlink" or "domain authority." No em dashes. Write it the way you'd actually talk to another founder.
- [ ] **Skip the fake urgency.** No "just following up," "circling back," or "checking in." Everyone's seen those, and everyone ignores them.

Here's roughly what a first email looks like for an unlinked mention:

```
Hi Erik,

Saw your roundup on blogger outreach tools and noticed BuzzStream gets a solid mention there. We built Mentiohunt to do exactly what that guide covers, just more automated, finding relevant places to pitch, pulling contact info, and spitting out draft outreach in minutes.

Would love to be included alongside those tools. Happy to collaborate in one of our upcoming articles about one area you're expert on: internet marketing!

Worth a quick chat?

Best,
Nico

P.S. Solid foundation you've built since 2010- that's admirable.
```

Short, specific, one ask, one offer. No filler.

### The follow-ups

If they don't reply, send two more, spaced a few days apart, not five.

- **Follow-up 1:** Don't restate the same ask in different words. Bring something new, a different outcome, a different offering item if one genuinely fits, a reason this is worth their thirty seconds. Don't mention when you first emailed them.
- **Follow-up 2 (final):** Say plainly this is the last one. Lead with whatever angle you haven't used yet. End with a genuine goodbye, something like "no hard feelings if timing isn't right, I won't follow up after this." Then actually stop.

Ask Claude to draft all three using the research you gathered in Steps 2 and 3, the offering that fits, and these rules as constraints.

> ⚠️ **Pitfall:** review before sending. An email that sounds slightly off in your own voice will read as obviously templated to the person receiving it.

## If you'd rather not do all this by hand

Everything above is exactly what we do, we just don't do it manually anymore.

Mentiohunt runs Steps 1 through 5 on its own, every day. You give it your sitemap or article URLs, and from there it:

- Finds sites worth contacting, using the same four methods from Step 2 (unlinked mentions, competitor backlinks, resource pages and listicles, broken links), automatically, daily.
- Surfaces the right contact for each one, so you're not hunting through About pages and WHOIS lookups yourself.
- Picks the offering that actually fits each prospect, based on what you've told it you're open to offering.
- Drafts the full 3-email sequence, researched and specific to that prospect, not templated.
- Sends email 1 automatically, then the follow-ups if there's no reply, so nothing sits in a drafts folder for three weeks.

The moment a prospect replies, automation stops. That's you now, from your own inbox, having the actual conversation, the same way you'd have it if you'd found the site yourself.

Your job becomes reviewing what it queues up and canceling the ones that aren't a fit, not doing the research and writing from scratch every time.

If you want to see it running on your own site, you can [try Mentiohunt here](https://mentiohunt.com).

Hope this get you hundreds of backlinks :)

Cheers,
Nico
