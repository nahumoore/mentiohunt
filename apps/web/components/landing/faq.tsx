type FaqItem = {
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    question: "What is Mentiohunt?",
    answer:
      "Mentiohunt is a distribution tool for founders and small marketing teams. It runs two engines in parallel: one that finds backlink opportunities from your published articles, and one that monitors Reddit and forums for posts where your product is a natural fit.",
  },
  {
    question: "How does the backlink engine work?",
    answer:
      "You provide your sitemap or article URLs. Mentiohunt fetches them daily, identifies websites where each article would be a good fit, surfaces contact details for the site owner, and prepares a ready-to-send email draft with the recipient address already attached.",
  },
  {
    question: "What communities does the monitoring cover?",
    answer:
      "Community monitoring currently covers Reddit and public forums. When a thread matches your product, Mentiohunt generates a suggested reply and sends you an email alert so you can respond while the conversation is still active.",
  },
  {
    question: "How does Mentiohunt score opportunities?",
    answer:
      "Each prospect is ranked by fit: how closely the target site or post aligns with your article's topic, audience, and outreach angle. Every score comes with a plain-language rationale so you can decide whether it deserves your time before acting.",
  },
  {
    question: "Do I need to verify contact details manually?",
    answer:
      "Mentiohunt surfaces contact details it finds during discovery, but does not claim they are verified. You should confirm accuracy before sending. The drafts and context are ready — final judgment stays with you.",
  },
  {
    question: "Is Mentiohunt right for agencies?",
    answer:
      "The tool is built for founders and small in-house teams today. Multi-client agency workflows are on the roadmap but do not drive current product decisions. If your team manages a single product, you are the intended user.",
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
            Everything you need to know before getting started with backlink
            building and community monitoring.
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
