import { IconEye, IconFileCheck, IconMailCheck } from "@tabler/icons-react"
import type { ComponentType } from "react"

type Item = {
  icon: ComponentType<{ className?: string }>
  heading: string
  detail: string
}

const items: Item[] = [
  {
    icon: IconEye,
    heading: "See the exact site before anything moves",
    detail:
      "You know the domain, the article it would appear in, and the DR before we write a single word of outreach.",
  },
  {
    icon: IconFileCheck,
    heading: "See why it's a fit — not just that it is",
    detail:
      "Every opportunity includes a plain-language rationale: topical relevance, audience overlap, and why your content belongs there.",
  },
  {
    icon: IconMailCheck,
    heading: "Review the email draft before it goes out",
    detail:
      "Nothing sends without your approval. You read the pitch, edit if you want, then approve with one click.",
  },
]

export function BurnedByAgencies() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-princeton-orange/7 blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            If you&apos;ve been burned
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Here&apos;s what&apos;s different.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            You see the exact site, the fit reason, and the outreach draft before we send a single email. Nothing moves without your approval.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-5xl">
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {items.map(({ icon: Icon, heading, detail }) => (
              <div key={heading} className="flex flex-col gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blaze-orange/10 text-(--color-blaze-orange)">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-snug text-foreground">{heading}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
