import { IconCircleCheck, IconStar } from "@tabler/icons-react"
import Image from "next/image"

/**
 * Social proof block for the finished opportunity preview. Sibling of
 * onboarding-visual.tsx (the wizard sidebar) — same testimonial and result,
 * laid out as a horizontal band for the wider preview page.
 *
 * PLACEHOLDER values — swap for a real, current customer result before launch.
 */
const RESULT_DOMAIN = "sunsama.com"

const TESTIMONIAL = {
  quote:
    "This tool found an opportunity on one of the sites with most authority in my niche, and I got a backlink in 12 days without paying for it, crazy!",
  author: "Logan Stuart",
  role: "Founder of Elevationvibe",
  avatar: "/landing/user-testimonial.webp",
}

const REVIEW_FACES = [
  "/landing/user_2.webp",
  "/landing/user_3.webp",
  "/landing/user_4.webp",
  "/landing/user_5.webp",
  "/landing/user_1.webp",
]

const PROOF_POINTS = [
  "Fewer, better-fit placements — not vanity metrics.",
  "Outreach sends from our accounts, never your domain.",
  "Cancel anything that isn’t a fit before it goes out.",
]

export function PreviewProof() {
  return (
    <section className="mt-10 rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-9">
      <p className="text-[0.7rem] font-bold tracking-[0.22em] text-primary uppercase">
        Proof it works
      </p>
      <h2 className="mt-3 max-w-[30ch] font-heading text-2xl font-semibold tracking-tight text-balance">
        Founders leave it running because the links show up.
      </h2>

      <div className="mt-7 grid gap-10 md:grid-cols-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-[76px] leading-[0.82] font-semibold tracking-[-0.05em] tabular-nums">
              12
            </span>
            <span className="font-heading text-xl font-semibold tracking-tight">
              days
            </span>
          </div>
          <p className="mt-4 max-w-[22ch] text-[17px] leading-snug font-medium tracking-tight">
            from finishing setup to a live backlink you didn’t pay for.
          </p>

          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2.5">
              {/* Google's favicon service isn't in next.config remotePatterns,
                  so this stays a plain img. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${RESULT_DOMAIN}&sz=64`}
                alt=""
                className="h-7 w-7 shrink-0 rounded"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">
                  {RESULT_DOMAIN}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  Live since day 12 &middot; earned with one email
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold text-primary">
                DR 61
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                Still live
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[15px] leading-relaxed">
            &ldquo;{TESTIMONIAL.quote}&rdquo;
          </p>
          <div className="mt-4 flex items-center gap-2.5">
            <Image
              src={TESTIMONIAL.avatar}
              alt=""
              width={34}
              height={34}
              className="h-[34px] w-[34px] shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold">{TESTIMONIAL.author}</p>
              <p className="mt-0.5 truncate text-muted-foreground">
                {TESTIMONIAL.role}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3.5 border-t border-border pt-5">
            <div className="flex shrink-0">
              {REVIEW_FACES.map((src, index) => (
                <span
                  key={src}
                  className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-background shadow-sm"
                  style={{ marginLeft: index === 0 ? 0 : "-0.5rem" }}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </span>
              ))}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <IconStar
                    key={index}
                    size={14}
                    className="fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="ml-1 text-sm font-bold">4.8</span>
                <span className="text-sm font-medium text-muted-foreground">
                  /5
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Trusted by{" "}
                <span className="font-semibold text-foreground">
                  100+ founders
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-5 border-t border-border pt-6 sm:grid-cols-3">
        {PROOF_POINTS.map((point) => (
          <p
            key={point}
            className="flex gap-2 text-xs leading-5 text-muted-foreground"
          >
            <IconCircleCheck className="mt-px h-4 w-4 shrink-0 text-primary" />
            {point}
          </p>
        ))}
      </div>
    </section>
  )
}
