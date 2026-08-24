import { PLANS } from "@/consts/billing"
import { features } from "@/consts/features"

export const dynamic = "force-static"

function buildHomeMarkdown(): string {
  const featuresMd = features
    .map((feature) => `- [${feature.shortTitle}](https://mentiohunt.com/features/${feature.slug}): ${feature.description}`)
    .join("\n")

  const plansMd = PLANS.map((plan) => `- ${plan.name} — $${plan.price}/month: ${plan.description}`).join("\n")

  return `# Mentiohunt

> Mentiohunt automates backlink prospecting and outreach for founder-led B2B SaaS teams — through the first reply. After that, the founder takes over the relationship personally. Provide a sitemap or article URLs and the system auto-fetches daily, finds websites where each article fits well, surfaces contact details for the site owner, generates a ready-to-send email draft, and runs outreach automatically until a prospect replies.

## How it works

1. Add your sitemap or a few article URLs.
2. Mentiohunt scans daily for websites where each article is a genuine topical fit.
3. Each opportunity ships with contact details, a fit rationale, and a ready-to-send outreach draft.
4. Outreach is scheduled automatically on discovery — you monitor the queue and cancel anything that isn't a fit.
5. Once a prospect replies, automation stops and you continue the conversation from your own connected mailbox.

## Features

${featuresMd}

## Plans

${plansMd}

Full pricing details: https://mentiohunt.com/pricing.md

## Learn more

- Full homepage: https://mentiohunt.com
- Pricing: https://mentiohunt.com/pricing
- Features: https://mentiohunt.com/features
- About: https://mentiohunt.com/about
- Blog: https://mentiohunt.com/blog
- llms.txt: https://mentiohunt.com/llms.txt
`
}

export function GET() {
  return new Response(buildHomeMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept, Accept-Encoding",
    },
  })
}
