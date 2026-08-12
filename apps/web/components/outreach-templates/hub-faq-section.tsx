const HUB_FAQS = [
  {
    question: "Are these templates free to use?",
    answer:
      "Yes. Copy them, edit them, send them under your own name. No attribution needed and no email gate on any of the articles.",
  },
  {
    question: "Do template emails still get replies?",
    answer:
      "A template gets replies when the research behind it is specific. Every article here explains which line you must personalize and what to research before sending — the structure is reusable, the specifics never are.",
  },
  {
    question: "How many follow-ups should I send?",
    answer:
      "Two, spaced three and eight days after the first email. Both templates are in the library. After that, the contact is not the problem — the fit is.",
  },
  {
    question: "What reply rate should I expect?",
    answer:
      "For well-targeted outreach with a genuine content fit, 8-15% reply and roughly a third of those convert to a placement. Anything advertised above that is measuring a different thing.",
  },
  {
    question: "Can Mentiohunt send these for me?",
    answer:
      "That's the product. You hand over your sitemap or article URLs, we find the sites where each article genuinely fits, draft the email, and schedule outreach automatically. You monitor the queue and cancel anything that isn't a fit.",
  },
]

export function OutreachTemplatesHubFaqSection() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            Questions
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            About these templates.
          </h2>
        </div>

        <div className="mx-auto mt-14 max-w-3xl space-y-5">
          {HUB_FAQS.map((faq) => (
            <div
              key={faq.question}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="font-heading text-base font-semibold tracking-tight">
                {faq.question}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
