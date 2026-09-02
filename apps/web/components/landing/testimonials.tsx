import { IconQuote } from "@tabler/icons-react"
import Image from "next/image"

import Azmedia from "../custom-icons/trusted/azmedia"
import { IconBrandReddinbox } from "../custom-icons/trusted/brand-reddinbox"
import Creately from "../custom-icons/trusted/creately"
import G2G from "../custom-icons/trusted/g2g"
import Metrobi from "../custom-icons/trusted/metrobi"

const testimonials = [
  {
    quote: "I actually like this tool, good job!",
    author: "Alex Chen",
    avatar: "/landing/user_1.webp",
  },
  {
    quote: "Mentiohunt found us opportunities we weren't knew we had",
    author: "Daniel Mitchell",
    avatar: "/landing/user_2.webp",
  },
  {
    quote: "I'm getting responses every single day. Good job Nicolas!",
    author: "Marcus Johnson",
    avatar: "/landing/user_3.webp",
  },
  {
    quote:
      "I've tried every backlink tool out there. Mentiohunt is the only one that actually tells you what to do next",
    author: "Elena Rodriguez",
    avatar: "/landing/user_4.webp",
  },
  {
    quote:
      "I love that I can see the fit, the angle, and the next outreach move.",
    author: "@joeeemi_",
    avatar: "/landing/user_5.webp",
  },
  {
    quote:
      "We're a two-person team. There's no way we'd run link building ourselves. Mentiohunt handles the prospecting and outreach, we monitor the queue and cancel what doesn't make sense.",
    author: "@leo_kenn22",
    avatar: "/landing/user_6.jpg",
  },
  {
    quote:
      "I'm on the personal development niche and this tool found a backlink opportunity on one of the highest authority sites in my niche, and 12 days later, I did my first collaboration with them without paying for it",
    author: "Logan Stuart",
    avatar: "/landing/user-testimonial.webp",
  },
]

const trustedBy = [
  { icon: G2G, name: "G2G" },
  { icon: Metrobi, name: "Metrobi" },
  { icon: Creately, name: "Creately" },
  { icon: Azmedia, name: "AZ Media" },
  { icon: IconBrandReddinbox, name: "Reddinbox", showName: true },
]

const firstRow = testimonials.slice(0, 4)
const secondRow = testimonials.slice(4)

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-background pt-10 pb-20 sm:pt-12 sm:pb-24 lg:pt-14 lg:pb-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-32 right-0 h-[30rem] w-[30rem] translate-x-1/4 rounded-full bg-princeton-orange/7 blur-[100px]" />
        <div className="absolute bottom-12 left-0 h-[26rem] w-[26rem] -translate-x-1/4 rounded-full bg-amber-flame/7 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            Founder feedback
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-[family-name:var(--font-figtree),var(--font-sans)] text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Loved by founders who build backlinks without running outreach
            themselves.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Real feedback from small teams using Mentiohunt to spot relevant
            opportunities, understand the fit, and move faster on outreach.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-6xl space-y-5 [mask-image:linear-gradient(to_right,transparent,black_9%,black_91%,transparent)]">
          <TestimonialMarquee items={firstRow} />
          <TestimonialMarquee items={secondRow} reverse />
        </div>
      </div>

      <style>{`
        @keyframes testimonials-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  )
}

function TestimonialMarquee({
  items,
  reverse = false,
}: {
  items: typeof testimonials
  reverse?: boolean
}) {
  return (
    <div className="overflow-hidden">
      <div
        className="flex w-max gap-5 pr-5 motion-reduce:animate-none"
        style={{
          animation: `testimonials-marquee 34s linear infinite ${reverse ? "reverse" : "normal"}`,
        }}
      >
        {[...items, ...items].map((testimonial, index) => (
          <article
            key={`${testimonial.author}-${index}`}
            className="relative min-h-[15.5rem] w-[19rem] shrink-0 overflow-hidden rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_22px_70px_-54px_rgba(0,0,0,0.65)] transition duration-300 hover:-translate-y-1 hover:border-blaze-orange/35 hover:shadow-[0_26px_80px_-58px_rgba(255,84,0,0.8)] sm:w-[23rem]"
          >
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blaze-orange/10 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  width={48}
                  height={48}
                  className="size-12 rounded-full border-2 border-blaze-orange/20 object-cover"
                />
                <div>
                  <p className="font-[family-name:var(--font-figtree),var(--font-sans)] font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                </div>
              </div>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blaze-orange/10 text-blaze-orange">
                <IconQuote className="size-4" />
              </div>
            </div>

            <p className="relative mt-5 text-sm leading-6 text-foreground sm:text-[0.95rem]">
              {testimonial.quote}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
