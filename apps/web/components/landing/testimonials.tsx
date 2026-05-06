import { IconBrandClaude } from "../custom-icons/brand-claude"
import { IconBrandFacebookCustom as IconBrandFacebook } from "../custom-icons/brand-facebook"
import { IconBrandGoogle } from "../custom-icons/brand-google"
import { IconBrandHackerNews } from "../custom-icons/brand-hacker-news"
import { IconBrandLinkedinCustom as IconBrandLinkedIn } from "../custom-icons/brand-linkedin"
import BrandPerplexity from "../custom-icons/brand-perplexity"
import { IconBrandProductHunt } from "../custom-icons/brand-product-hunt"
import { IconBrandQuora } from "../custom-icons/brand-quora"
import { IconBrandReddinbox } from "../custom-icons/brand-reddinbox"
import { IconBrandTikTokCustom as IconBrandTikTok } from "../custom-icons/brand-tiktok"
import { IconBrandXCustom as IconBrandX } from "../custom-icons/brand-x"
import { IconBrandYoutubeCustom as IconBrandYouTube } from "../custom-icons/brand-youtube"
import Azmedia from "../custom-icons/trusted/azmedia"
import Creately from "../custom-icons/trusted/creately"
import G2G from "../custom-icons/trusted/g2g"
import Metrobi from "../custom-icons/trusted/metrobi"

const testimonials = [
  {
    quote:
      "I was spending hours every week searching for backlink opportunities. Mentiohunt gave me back that time and actually found better prospects than I would have found on my own.",
    author: "Alex Chen",
    role: "Founder, Stackwise",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  },
  {
    quote:
      "The daily digest is a game-changer. I went from random outreach to having a clear plan every morning. My conversion rate on pitches has doubled.",
    author: "Sarah Mitchell",
    role: "Growth Lead, LaunchPad",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    quote:
      "Finally, something that explains WHY an opportunity matters. The reasoning behind each recommendation helps me prioritize what actually moves the needle.",
    author: "Marcus Johnson",
    role: "Solo Founder, IndieHacker",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
  },
  {
    quote:
      "I've tried every backlink tool out there. Mentiohunt is the only one that actually tells you what to do next. No more staring at spreadsheets wondering what to do.",
    author: "Elena Rodriguez",
    role: "CMO, ScaleLab",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
  },
]

const socialProof = [
  { icon: IconBrandProductHunt, name: "Product Hunt", featured: true },
  { icon: IconBrandLinkedIn, name: "LinkedIn" },
  { icon: IconBrandX, name: "X" },
  { icon: IconBrandReddinbox, name: "Reddit" },
  { icon: IconBrandQuora, name: "Quora" },
  { icon: IconBrandFacebook, name: "Facebook" },
  { icon: IconBrandHackerNews, name: "Hacker News" },
  { icon: IconBrandYouTube, name: "YouTube" },
  { icon: IconBrandTikTok, name: "TikTok" },
  { icon: IconBrandGoogle, name: "Google" },
  { icon: IconBrandClaude, name: "Claude" },
  { icon: BrandPerplexity, name: "Perplexity" },
]

const trustedBy = [
  { icon: G2G, name: "G2G" },
  { icon: Metrobi, name: "Metrobi" },
  { icon: Creately, name: "Creately" },
  { icon: Azmedia, name: "AZ Media" },
]

function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  )
}

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--crimson-carrot)_0%,_transparent_50%)] opacity-[0.03]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--deep-saffron)_0%,_transparent_50%)] opacity-[0.03]" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <VerifiedBadge className="size-3" />
            Verified Results
          </span>
          <h2 className="mt-6 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[42px]">
            Loved by Founders Who Build Links
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Real feedback from people who stopped guessing and started growing
            their backlink strategy with Mentiohunt.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_40px_-10px_var(--crimson-carrot)]/20"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="absolute -top-3 -left-3 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <div className="mt-4">
                <p className="text-base leading-relaxed text-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  width={48}
                  height={48}
                  className="size-12 rounded-full border-2 border-primary/20"
                />
                <div>
                  <p className="font-heading font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <div className="text-center">
            <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
              As Seen Across The Web
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-6">
            {socialProof.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 text-muted-foreground/60 transition-colors hover:text-primary"
              >
                <item.icon className="size-5" />
                <span className="text-sm font-medium">{item.name}</span>
                {item.featured && (
                  <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    Featured
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-secondary/50 p-8">
          <div className="text-center">
            <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
              Trusted by Growing Teams
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {trustedBy.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 opacity-70 transition-opacity hover:opacity-100"
              >
                <item.icon className="h-8 w-auto text-foreground" />
                <span className="text-lg font-semibold text-foreground">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
