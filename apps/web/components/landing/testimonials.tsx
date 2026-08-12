import { IconQuote } from "@tabler/icons-react"
import Image from "next/image"

import Azmedia from "../custom-icons/trusted/azmedia"
import { IconBrandReddinbox } from "../custom-icons/trusted/brand-reddinbox"
import Creately from "../custom-icons/trusted/creately"
import G2G from "../custom-icons/trusted/g2g"
import Metrobi from "../custom-icons/trusted/metrobi"

const testimonials = [
  {
    quote:
      "I was spending hours every week searching for backlink opportunities. Mentiohunt gave me back that time and actually found better prospects than I would have found on my own.",
    author: "Alex Chen",
    role: "Founder, Stackwise",
    avatar: "/landing/user_1.webp",
  },
  {
    quote:
      "We dropped our link building agency because we had no idea what we were paying for. Mentiohunt shows us the fit, the placement, and why it makes sense — before anything goes live.",
    author: "Sarah Mitchell",
    role: "Growth Lead, LaunchPad",
    avatar: "/landing/user_2.webp",
  },
  {
    quote:
      "Finally, something that explains WHY an opportunity matters. The reasoning behind each recommendation helps me prioritize what actually moves the needle.",
    author: "Marcus Johnson",
    role: "Solo Founder, IndieHacker",
    avatar: "/landing/user_3.webp",
  },
  {
    quote:
      "I've tried every backlink tool out there. Mentiohunt is the only one that actually tells you what to do next. No more staring at spreadsheets wondering what to do.",
    author: "Elena Rodriguez",
    role: "CMO, ScaleLab",
    avatar: "/landing/user_4.webp",
  },
  {
    quote:
      "The opportunity rationale is what sold me. I can see the fit, the angle, and the next outreach move without building another research spreadsheet.",
    author: "Nina Patel",
    role: "Founder, RelayKit",
    avatar: "/landing/user_5.webp",
  },
  {
    quote:
      "We're a two-person team. There's no way we'd run link building ourselves. Mentiohunt handles the prospecting and outreach — we monitor the queue and cancel what doesn't make sense.",
    author: "Owen Brooks",
    role: "Growth, Draftbase",
    avatar: "/landing/user_6.jpg",
  },
  {
    quote:
      "I used to dread link building because it meant managing another campaign. Now I spend maybe 15 minutes a week reviewing what Mentiohunt surfaced. Everything else is handled.",
    author: "Maya Torres",
    role: "Solo Founder, Northstar",
    avatar: "/landing/user_7.jpg",
  },
  {
    quote:
      "We stopped chasing random link lists. The scoring and reasoning helped our small team focus on opportunities that actually made sense for our product.",
    author: "Leo Martin",
    role: "Marketing Lead, Vectorly",
    avatar: "/landing/user_8.jpg",
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
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Loved by founders who build backlinks without running outreach themselves.
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

        <div className="mx-auto mt-16 max-w-6xl rounded-[2rem] border border-border bg-card/70 px-8 py-9 shadow-[0_24px_80px_-64px_rgba(255,84,0,0.7)] backdrop-blur-sm sm:px-10 lg:px-14">
          <div className="text-center">
            <p className="text-[0.7rem] font-bold text-muted-foreground uppercase">
              Trusted by Brands like
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-12 lg:gap-x-16 xl:gap-x-20">
            {trustedBy.map((item) => (
              <div
                key={item.name}
                className="group flex h-14 items-center justify-center gap-3 opacity-65 transition duration-300 hover:-translate-y-0.5 hover:opacity-100"
                title={item.name}
              >
                <item.icon className="h-8 w-auto text-foreground transition duration-300 group-hover:text-blaze-orange" />
                {item.showName ? (
                  <span className="text-2xl font-semibold tracking-tight text-foreground transition duration-300 group-hover:text-blaze-orange">
                    {item.name}
                  </span>
                ) : (
                  <span className="sr-only">{item.name}</span>
                )}
              </div>
            ))}
          </div>
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
                  <p className="font-heading font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {testimonial.role}
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
