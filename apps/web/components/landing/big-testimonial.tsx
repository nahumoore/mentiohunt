import UserTestimonial from "@/public/landing/user-testimonial.webp"
import { IconArrowRight, IconQuote } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"

const ELEVATIONVIBE_FAVICON =
  "https://www.google.com/s2/favicons?domain=elevationvibe.com&sz=64"

export function BigTestimonial() {
  return (
    <section
      id="case-study"
      aria-labelledby="big-testimonial-title"
      className="relative overflow-hidden bg-background py-10 sm:py-12 lg:py-14"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-princeton-orange)]/6 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <figure className="relative mx-auto max-w-5xl">
          <div className="relative grid gap-6 sm:gap-8 md:grid-cols-[11rem_minmax(0,1fr)] md:items-center">
            <div className="relative h-40 overflow-hidden rounded-[1.35rem] bg-muted sm:h-44 md:h-48">
              <Image
                src={UserTestimonial}
                alt="Logan Stuart"
                fill
                sizes="(min-width: 768px) 176px, 100vw"
                className="object-cover grayscale-[0.15] saturate-[0.9]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 to-transparent" />
            </div>

            <figcaption className="relative">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <IconQuote className="h-8 w-8 shrink-0 text-[var(--color-blaze-orange)]/45" />
                  <p className="text-[0.65rem] font-bold text-[var(--color-blaze-orange)] uppercase">
                    Real campaign result
                  </p>
                </div>

                <h2
                  id="big-testimonial-title"
                  className="font-[family-name:var(--font-figtree),var(--font-sans)] text-2xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-3xl lg:text-[2.45rem]"
                >
                  3 contextual backlinks in the first month.
                </h2>
                <blockquote className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                  “Mentiohunt found one of the highest-authority sites in my
                  niche, and I earned a backlink in 12 days without paying for
                  the placement.”
                </blockquote>
              </div>

              <div className="mt-6">
                <p className="font-[family-name:var(--font-figtree),var(--font-sans)] text-base font-semibold tracking-tight text-foreground">
                  Logan Stuart
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Image
                    src={ELEVATIONVIBE_FAVICON}
                    alt=""
                    width={14}
                    height={14}
                    unoptimized
                    className="rounded-sm"
                  />
                  Founder of Elevationvibe
                  <span className="text-muted-foreground/40">&middot;</span>
                  <Link
                    href="/case-studies/elevationvibe"
                    className="inline-flex items-center gap-1 underline decoration-muted-foreground/30 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/50"
                  >
                    See case study
                    <IconArrowRight size={12} stroke={2.5} />
                  </Link>
                </div>
              </div>
            </figcaption>
          </div>
        </figure>
      </div>
    </section>
  )
}
