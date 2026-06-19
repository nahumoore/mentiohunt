import {
  IconRocket,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react"
import Image from "next/image"

const personas = [
  {
    title: "SaaS Founders",
    eyebrow: "Founder-led growth",
    image: "/landing/user_2.webp",
    description:
      "For founders who publish and ship but can't justify running link building as an internal function — and don't want another agency relationship.",
    Icon: IconRocket,
  },
  {
    title: "Small Marketing Teams",
    eyebrow: "Lean growth teams",
    image: "/landing/user_4.webp",
    description:
      "For small teams managing content and SEO who need a repeatable backlink pipeline instead of scattered manual prospecting.",
    Icon: IconUsers,
  },
  {
    title: "Growth & SEO Leads",
    eyebrow: "In-house SEO",
    image: "/landing/user_5.webp",
    description:
      "For heads of growth and SEO leads at B2B SaaS who own link building as a function but can't afford to run outreach operations in-house.",
    Icon: IconTrendingUp,
  },
]

export function TargetPersonas() {
  return (
    <section
      id="target-personas"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[var(--color-princeton-orange)]/6 blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-[var(--color-blaze-orange)] uppercase">
            Who it is for
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            For teams that need backlinks without running outreach themselves.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Mentiohunt is for founder-led B2B SaaS teams who know backlinks
            matter but can't justify operating link building as an internal
            function.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:gap-7">
          {personas.map((persona, index) => {
            const Icon = persona.Icon

            return (
              <article
                key={persona.title}
                className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_18px_60px_-46px_rgba(0,0,0,0.45)]"
              >
                <div className="relative h-64 overflow-hidden bg-card sm:h-72 lg:h-64 xl:h-72">
                  <Image
                    src={persona.image}
                    alt={`${persona.title} persona`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>

                <div className="relative z-10 -mt-px bg-card p-6 before:absolute before:inset-x-0 before:-top-16 before:h-16 before:bg-gradient-to-t before:from-card before:via-card/85 before:to-transparent before:content-['']">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <p className="text-[0.65rem] font-bold text-[var(--color-blaze-orange)] uppercase">
                      {persona.eyebrow}
                    </p>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <h3 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                    {persona.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {persona.description}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
