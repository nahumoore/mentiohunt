type FaqItem = {
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    question: "What is Mentiohunt?",
    answer:
      "Mentiohunt is a managed backlink placement autopilot for founder-led B2B SaaS teams. It handles prospect discovery, outreach, and placement coordination end-to-end. Your only job is to approve or reject opportunities before anything goes live.",
  },
  {
    question: "How does it work?",
    answer:
      "You provide your site or article URLs. Mentiohunt runs daily discovery to find websites where your content is a relevant fit, surfaces contact details, and runs outreach on your behalf. Every opportunity includes a fit rationale, placement angle, and expected SEO value before you approve it.",
  },
  {
    question: "How does the approval workflow work?",
    answer:
      "Every opportunity is surfaced to you before outreach starts. You see the target site, why it's a fit, and the outreach angle. Approve to proceed, reject to skip. Nothing goes live without your sign-off — approval is a core product behavior, not an add-on.",
  },
  {
    question: "How does Mentiohunt score opportunities?",
    answer:
      "Each prospect is ranked by fit: how closely the target site aligns with your content's topic, audience, and outreach angle. Every score comes with a plain-language rationale so you understand why an opportunity was surfaced before acting on it.",
  },
  {
    question: "How is this different from a link building agency?",
    answer:
      "More transparent and more controllable. You see the target site, fit rationale, and outreach draft before anything goes live. Agencies typically operate as a black box — you pay a retainer and get links without visibility into why. Mentiohunt charges a flat monthly fee, not a commission per link.",
  },
  {
    question: "Is Mentiohunt right for my team size?",
    answer:
      "Mentiohunt is built for founder-led B2B SaaS teams that can't justify running link building as an internal function — typically 2 to 30 people. If you're already using an agency or running outreach manually and it's eating time you don't have, it's a good fit.",
  },
  {
    question: "Do you do guest posting?",
    answer:
      "Yes. Guest posts are one of the placement types we actively target, alongside resource pages, product roundups, and editorial listicles. When you provide your article URLs, we match each one to sites where a guest post would be a natural fit — and draft the pitch for you to approve before anything goes out.",
  },
  {
    question: "How long until my first placed backlink?",
    answer:
      "Most customers see their first placed backlink within 14–21 days of setup. Discovery starts immediately after you add your URLs, but placement timelines depend on site owner response rates. We follow up on your behalf so you don't have to track any threads.",
  },
  {
    question: "What's your outreach reply rate?",
    answer:
      "Reply rates vary by niche and site quality, but we typically see 15–30% on well-matched opportunities. We only surface high-fit prospects — which keeps reply rates higher than spray-and-pray campaigns — and personalize each email to the specific site and angle.",
  },
  {
    question: "What does an opportunity card look like?",
    answer:
      "Each card shows the target site name, domain rating, monthly traffic, a plain-language fit rationale (why your content belongs there), the suggested placement angle, and a ready-to-review email draft. You approve or reject in one click — everything you need is on the card without leaving the dashboard.",
  },
  {
    question: "What if my niche has few link opportunities?",
    answer:
      "Niche B2B SaaS often has fewer sites but higher-quality placements. We scan competitor backlink profiles, industry resource pages, and niche directories specific to your space — not just generic lists. Narrower niches typically see fewer total opportunities but higher fit scores per opportunity.",
  },
  {
    question: "Are the emails AI-generated?",
    answer:
      "Email drafts are AI-assisted but personalized per site — not mass-templated. Each draft is tailored to the specific target, placement angle, and fit rationale. You review every draft before it goes out. Nothing sends without your sign-off.",
  },
]

export function Faq() {
  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32"
      aria-labelledby="faq-title"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-0 h-[26rem] w-[26rem] -translate-x-1/3 rounded-full bg-[var(--color-princeton-orange)]/6 blur-[100px]" />
        <div className="absolute top-1/3 right-0 h-[20rem] w-[20rem] translate-x-1/4 rounded-full bg-[var(--color-amber-flame)]/7 blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-[var(--color-blaze-orange)] uppercase">
            FAQ
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
          <h2
            id="faq-title"
            className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]"
          >
            Common questions
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Everything you need to know before getting started with managed
            backlink placement.
          </p>
        </div>

        <dl className="mx-auto mt-14 max-w-6xl grid gap-px bg-border/70 overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-3">
          {faqs.map((item, index) => (
            <div
              key={item.question}
              className="group flex flex-col gap-3 bg-background p-7 transition-colors duration-200 hover:bg-blaze-orange/3"
            >
              <span
                aria-hidden="true"
                className="font-heading text-sm font-bold tabular-nums text-blaze-orange/40 transition-colors duration-200 group-hover:text-(--color-blaze-orange)"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <dt className="text-sm font-semibold leading-6 text-foreground sm:text-base">
                {item.question}
              </dt>
              <dd className="text-sm leading-7 text-muted-foreground">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
