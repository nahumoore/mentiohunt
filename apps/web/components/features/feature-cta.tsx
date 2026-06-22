import { IconArrowRight } from "@tabler/icons-react"
import Link from "next/link"

import type { FeaturePage } from "@/consts/features"
import { Button } from "@workspace/ui/components/button"

type Props = {
  feature: Pick<FeaturePage, "cta">
}

export function FeatureCta({ feature }: Props) {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-princeton-orange/7 blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-[var(--color-blaze-orange)]/20 bg-[linear-gradient(135deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-background)_78%,var(--color-amber-glow)_22%)_100%)] p-8 text-center shadow-[0_32px_100px_-48px_rgba(255,133,0,0.48)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/40 to-transparent" />
          <p className="font-heading text-3xl font-semibold tracking-[-0.05em] text-balance sm:text-4xl">
            {feature.cta.title}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {feature.cta.description}
          </p>
          <Button
            asChild
            size="lg"
            className="group mt-8 h-12 rounded-full px-7 text-sm font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
          >
            <Link href="/signup">
              {feature.cta.button}
              <IconArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
