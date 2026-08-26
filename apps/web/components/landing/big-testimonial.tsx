import UserTestimonial from "@/public/landing/user-testimonial.webp"
import { IconQuote } from "@tabler/icons-react"
import Image from "next/image"

export function BigTestimonial() {
  return (
    <section
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
                    Testimonial
                  </p>
                </div>

                <blockquote>
                  <h2
                    id="big-testimonial-title"
                    className="font-heading text-2xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-3xl lg:text-[2.45rem]"
                  >
                    This tool found an opportunity on one of the sites with
                    most authority in my niche, and I got a backlink in 12
                    days without paying for it, crazy!
                  </h2>
                </blockquote>
              </div>

              <div className="mt-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-heading text-base font-semibold tracking-tight text-foreground">
                    Logan Stuart
                  </p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Founder of Elevationvibe
                  </p>
                </div>
              </div>
            </figcaption>
          </div>
        </figure>
      </div>
    </section>
  )
}
