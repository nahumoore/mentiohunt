import { FREE_TRIAL_DAYS, FREE_TRIAL_MAX_PAGES, PLANS } from "@/consts/billing"
import { LANDING_FAQS } from "@/consts/faq"

export const dynamic = "force-static"

const BILLING_FAQ_QUESTIONS = [
  "Is Mentiohunt right for my team size?",
  "How is this different from a link building agency?",
  "What happens when my 7-day free trial ends?",
  "If a prospect replies after my trial ends, do I lose the reply?",
]

function buildPricingMarkdown(): string {
  const plansMd = PLANS.map((plan, index) => {
    const previousPlan = index > 0 ? PLANS[index - 1] : null
    const intro = previousPlan
      ? `Everything in ${previousPlan.name}, plus:`
      : "Includes:"
    const featuresMd = plan.features.map((feature) => `- ${feature}`).join("\n")

    return `### ${plan.name} — $${plan.price}/month\n\n${plan.description}\n\n${intro}\n${featuresMd}`
  }).join("\n\n")

  const faqMd = LANDING_FAQS.filter((faq) =>
    BILLING_FAQ_QUESTIONS.includes(faq.question)
  )
    .map((faq) => `### ${faq.question}\n\n${faq.answer}`)
    .join("\n\n")

  return `# Mentiohunt Pricing

> Mentiohunt automates backlink prospecting and outreach for B2B SaaS founders — you take over once a prospect replies. ${PLANS.length} plans, both starting with a ${FREE_TRIAL_DAYS}-day free trial — no card required to sign up. Full page: https://mentiohunt.com/pricing

## Plans

${plansMd}

## How billing works

- Free trial: ${FREE_TRIAL_DAYS} days, up to ${FREE_TRIAL_MAX_PAGES} pages scanned, no credit card required at signup.
- Billed monthly, cancel anytime — no long-term contract.
- When a trial ends without upgrading, discovery and outreach pause and dashboard access locks. Nothing is deleted: the opportunity queue, contacts, drafts, and any replies received are preserved and restored on upgrade.

## FAQ

${faqMd}

## Learn more

- Pricing page: https://mentiohunt.com/pricing
- Features: https://mentiohunt.com/features
- Homepage: https://mentiohunt.com
- llms.txt: https://mentiohunt.com/llms.txt
`
}

export function GET() {
  return new Response(buildPricingMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
}
