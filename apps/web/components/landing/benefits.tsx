import {
  IconArticle,
  IconListCheck,
  IconMailFast,
  IconRadar2,
  IconTargetArrow,
  IconTrendingUp,
} from "@tabler/icons-react"

const benefits = [
  {
    title: "Every article can open 1,000+ fits",
    description:
      "For each article you publish, there are relevant pages, roundups, directories, and resource lists where it may fit for a backlink. You just need to find them and ask well.",
    icon: IconArticle,
  },
  {
    title: "Know what to do next",
    description:
      "Every surfaced opportunity comes with a recommended action, so you are not sorting tabs, spreadsheets, and half-qualified prospects.",
    icon: IconListCheck,
  },
  {
    title: "Prioritize by fit, not volume",
    description:
      "See why an opportunity matches your product, audience, or article before spending time on outreach.",
    icon: IconTargetArrow,
  },
  {
    title: "Start with a real angle",
    description:
      "Get outreach context, suggested positioning, and contact details when available without pretending acquisition is guaranteed.",
    icon: IconMailFast,
  },
  {
    title: "Catch conversations while they matter",
    description:
      "Community mentions and backlink prospects land in the same distribution workflow, so timely opportunities do not slip away.",
    icon: IconRadar2,
  },
  {
    title: "Build long-term search momentum",
    description:
      "Work toward hundreds of legitimate backlinks from relevant sites, the compounding channel that helps your site grow long after a campaign ends.",
    icon: IconTrendingUp,
  },
]

const proofPoints = ["Scored fit", "Outreach prep", "Daily queue"]

export function Benefits() {
  const featured = benefits[0]!
  const FeaturedIcon = featured.icon
  const footer = benefits[5]!
  const FooterIcon = footer.icon
  const middle = benefits.slice(1, 5)

  return (
    <section
      id="benefits"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-16 h-[520px] w-[520px] rounded-full bg-[var(--color-princeton-orange)]/8 blur-[110px]" />
        <div className="absolute left-1/3 -bottom-24 h-[400px] w-[400px] rounded-full bg-[var(--color-amber-flame)]/6 blur-[90px]" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.4fr] lg:items-start lg:gap-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/10 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.16em] text-[var(--color-blaze-orange)] uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-blaze-orange)]" />
              Why it works
            </span>
            <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
              From scattered research to a daily opportunity queue
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Mentiohunt turns links, keywords, competitors, and community
              signals into ranked actions you can review, trust, and send.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {proofPoints.map((point) => (
                <span
                  key={point}
                  className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm"
                >
                  {point}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Card 01 — featured */}
            <article className="group relative col-span-2 overflow-hidden rounded-2xl border border-[var(--color-blaze-orange)]/20 bg-card p-6 transition duration-300 hover:-translate-y-0.5 sm:p-7">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/50 to-transparent" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-blaze-orange)] text-white shadow-[0_4px_16px_-2px_rgba(255,84,0,0.5)]">
                  <FeaturedIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                    {featured.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted-foreground sm:text-base">
                    {featured.description}
                  </p>
                </div>
              </div>
            </article>

            {/* Cards 02–05 */}
            {middle.map((benefit) => {
              const Icon = benefit.icon
              return (
                <article
                  key={benefit.title}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[var(--color-blaze-orange)]/25 hover:shadow-[0_8px_40px_-12px_rgba(255,84,0,0.15)] sm:p-6"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)] ring-1 ring-[var(--color-blaze-orange)]/15 transition duration-300 group-hover:bg-[var(--color-blaze-orange)] group-hover:text-white group-hover:shadow-[0_4px_12px_-2px_rgba(255,84,0,0.35)] group-hover:ring-transparent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-base font-semibold tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {benefit.description}
                  </p>
                </article>
              )
            })}

            {/* Card 06 — footer */}
            <article className="group relative col-span-2 overflow-hidden rounded-2xl border border-border bg-card p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--color-blaze-orange)]/20 sm:p-6">
              <div className="relative flex items-start gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)] ring-1 ring-[var(--color-blaze-orange)]/15 transition duration-300 group-hover:bg-[var(--color-blaze-orange)] group-hover:text-white group-hover:shadow-[0_4px_12px_-2px_rgba(255,84,0,0.35)] group-hover:ring-transparent">
                  <FooterIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold tracking-tight">
                    {footer.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {footer.description}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
