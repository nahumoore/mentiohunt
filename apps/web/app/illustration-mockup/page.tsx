import type { Metadata } from "next"
import type { ReactNode } from "react"

import {
  ConceptAnchorText,
  ConceptBacklinkPages,
  ConceptBrowserWindow,
  ConceptBylineRule,
  ConceptCoBrandLockup,
  ConceptDottedRoute,
  ConceptEnvelope,
  ConceptInterlockingArcs,
  ConceptLinkGraph,
  ConceptOrbit,
  ConceptOutboundArc,
  ConceptPolaroid,
  ConceptPostageStamp,
  ConceptRibbon,
  ConceptRoutePill,
  ConceptTabStack,
  ConceptUrlBarChip,
  ConceptVenn,
  type ConceptComponent,
} from "@/components/custom-icons/mockups/partnership-concepts"

export const metadata: Metadata = {
  title: "Illustration concepts — case studies partnership mark",
  robots: { index: false, follow: false },
}

type Concept = {
  n: number
  name: string
  idea: string
  Component: ConceptComponent
  /** Sizes to render, in px height. */
  sizes: number[]
  /** Optional note about which usages it realistically survives. */
  note?: string
  /** Much wider than tall — stack the size variants instead of putting them side by side. */
  wide?: boolean
}

const COMPANIES = [
  { companyUrl: "https://elevationvibe.com", companyName: "Elevation Vibe" },
  { companyUrl: "https://reddinbox.com", companyName: "Reddinbox" },
]

const AVATAR = 44
const THUMB = 60
const HERO = 120

const SIZE_LABEL: Record<number, string> = {
  [AVATAR]: "44px — quote avatar",
  [THUMB]: "60px — hub card thumb",
  [HERO]: "120px — hero visual",
}

const CATEGORIES: { title: string; blurb: string; concepts: Concept[] }[] = [
  {
    title: "A — Icon & mark based",
    blurb:
      "Purely graphic marks. These are the only ones that genuinely survive the 44px quote avatar.",
    concepts: [
      {
        n: 1,
        name: "Orbit",
        idea: "The customer's site orbits the Mentiohunt mark on a dashed orbit ring — one is clearly the system, the other the site it works on.",
        Component: ConceptOrbit,
        sizes: [AVATAR, THUMB, HERO],
      },
      {
        n: 2,
        name: "Venn field",
        idea: "Two translucent circles overlap and darken in the middle — shared ground rather than two logos bolted together.",
        Component: ConceptVenn,
        sizes: [AVATAR, THUMB, HERO],
      },
      {
        n: 3,
        name: "Tab stack",
        idea: "Three receding cards like a stack of browser tabs, the customer's site sitting on top of the Mentiohunt queue underneath.",
        Component: ConceptTabStack,
        sizes: [AVATAR, THUMB, HERO],
      },
      {
        n: 4,
        name: "Outbound arc",
        idea: "A dashed arc arrow leaving the Mentiohunt tile and landing on the site tile — outreach direction made literal.",
        Component: ConceptOutboundArc,
        sizes: [AVATAR, THUMB, HERO],
      },
      {
        n: 5,
        name: "Sent mail",
        idea: "An envelope with an orange flap carrying the Mentiohunt mark, and the customer's favicon franked on as the stamp.",
        Component: ConceptEnvelope,
        sizes: [AVATAR, THUMB, HERO],
      },
      {
        n: 6,
        name: "Link graph",
        idea: "Node-and-edge diagram: Mentiohunt node joined to the site node, with faint neighbour nodes hinting at the wider discovery graph.",
        Component: ConceptLinkGraph,
        sizes: [AVATAR, THUMB, HERO],
      },
      {
        n: 7,
        name: "Polaroid",
        idea: "The site framed like a photo print, its name handwritten on the lower lip — reads as a captured, filed result.",
        Component: ConceptPolaroid,
        sizes: [AVATAR, THUMB, HERO],
        note: "The name on the lip only becomes readable from ~60px up.",
      },
      {
        n: 8,
        name: "Browser window",
        idea: "A mini browser chrome with the domain in the address bar and a small orange Mentiohunt tab peeking out behind it.",
        Component: ConceptBrowserWindow,
        sizes: [THUMB, HERO],
        note: "Skipped at 44px — the address bar text collapses. Thumb + hero only.",
      },
      {
        n: 9,
        name: "Postage stamp",
        idea: "A rotated stamp with a dashed inner rule, an orange corner wedge, the favicon and a tiny 'LINKED' overprint.",
        Component: ConceptPostageStamp,
        sizes: [AVATAR, THUMB, HERO],
        note: "Works as a shape at 44px; the 'LINKED' microtext only reads from ~60px.",
      },
    ],
  },
  {
    title: "B — Text & wordmark based",
    blurb:
      "Type-led treatments that put the actual domain on screen. Designed for hub cards and hero slots; none of these are 44px avatars.",
    concepts: [
      {
        n: 10,
        name: "Route pill",
        idea: "One mono pill reading mentiohunt.com → their domain, with an arrow between the two — the relationship spelled out.",
        Component: ConceptRoutePill,
        sizes: [THUMB, HERO],
        note: "Wide, not square. Best as a caption strip or hero band, never as an avatar.",
        wide: true,
      },
      {
        n: 11,
        name: "URL-bar chip",
        idea: "An address-bar style chip: padlock, the live domain in mono, a divider, then 'linked via Mentiohunt'.",
        Component: ConceptUrlBarChip,
        sizes: [THUMB, HERO],
        note: "Caption / hero only.",
        wide: true,
      },
      {
        n: 12,
        name: "Co-brand lockup",
        idea: "Classic partnership lockup — Mentiohunt wordmark × the company wordmark — inside one rounded badge.",
        Component: ConceptCoBrandLockup,
        sizes: [THUMB, HERO],
        note: "Caption / hero only.",
        wide: true,
      },
      {
        n: 13,
        name: "Byline rule",
        idea: "No container at all: an orange vertical rule, 'CASE STUDY' eyebrow, the company name, the domain in mono underneath.",
        Component: ConceptBylineRule,
        sizes: [THUMB, HERO],
        note: "Meant to sit beside a quote instead of an avatar, or as a card footer.",
      },
      {
        n: 14,
        name: "Ribbon",
        idea: "A notched 'CASE STUDY' ribbon banner in brand gradient, with the company name and favicon sitting below it.",
        Component: ConceptRibbon,
        sizes: [THUMB, HERO],
        note: "Hub card / hero only.",
        wide: true,
      },
    ],
  },
  {
    title: "C — Abstract & diagrammatic",
    blurb:
      "Less literal, more about the mechanic: a link between two pages, a route travelled, an anchor text in the wild.",
    concepts: [
      {
        n: 15,
        name: "Backlink pages",
        idea: "Two page shapes with a curved link arrow between them — the referring page on the left, the linked article on the right. Thematically the exact product.",
        Component: ConceptBacklinkPages,
        sizes: [AVATAR, THUMB, HERO],
      },
      {
        n: 16,
        name: "Dotted route",
        idea: "Two labelled endpoints joined by a dotted travelled path — mentiohunt.com on one end, their domain on the other.",
        Component: ConceptDottedRoute,
        sizes: [THUMB, HERO],
        note: "Very wide. Hero band or card footer.",
        wide: true,
      },
      {
        n: 17,
        name: "Interlocking arcs",
        idea: "Two open brackets interlocked like a chain link — one orange, one neutral — with the favicon tucked in the join.",
        Component: ConceptInterlockingArcs,
        sizes: [AVATAR, THUMB, HERO],
      },
      {
        n: 18,
        name: "Anchor text",
        idea: "The backlink itself: a snippet of their copy with 'Mentiohunt' underlined as a live link, credited to their domain below.",
        Component: ConceptAnchorText,
        sizes: [THUMB, HERO],
        note: "Hero only in practice — it's a quote card, not a mark.",
        wide: true,
      },
    ],
  },
]

function Stage({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex min-h-[9.5rem] w-full items-center justify-center overflow-x-auto rounded-2xl border border-border bg-gradient-to-br from-muted/70 to-muted/20 px-4 py-6">
        {children}
      </div>
      <span className="text-[0.65rem] font-medium tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export default function IllustrationMockupPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <span className="text-[0.7rem] font-bold text-[var(--color-blaze-orange)] uppercase">
            Internal — not indexed
          </span>
          <h1 className="mt-4 font-heading text-4xl leading-tight font-semibold tracking-[-0.05em] text-balance sm:text-5xl">
            Illustration concepts — case studies partnership mark
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Eighteen distinct directions for the visual that represents
            &ldquo;Mentiohunt worked with this site&rdquo;. Each one is rendered
            for two real customers and at the sizes it actually has to survive:
            the 44px avatar next to a quote, the 60px hub-card thumbnail, and
            the ~120px hero visual. Pick one by number — or tell me which
            category is closest and I&rsquo;ll push further in that direction.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Nothing here is wired into the live case-study pages yet. The
            existing badge is untouched.
          </p>
        </header>

        {CATEGORIES.map((category) => (
          <section key={category.title} className="mt-16">
            <div className="border-b border-border pb-4">
              <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
                {category.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {category.blurb}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-10">
              {category.concepts.map((concept) => (
                <article
                  key={concept.n}
                  className="overflow-hidden rounded-[1.75rem] border border-border bg-card/95 p-6 shadow-[0_20px_70px_-52px_rgba(17,17,17,0.35)] sm:p-8"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-heading text-xl font-semibold tracking-[-0.03em] text-[var(--color-princeton-orange)]">
                      {concept.n}.
                    </span>
                    <h3 className="font-heading text-xl font-semibold tracking-[-0.03em]">
                      {concept.name}
                    </h3>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {concept.idea}
                  </p>
                  {concept.note && (
                    <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--color-blaze-orange)]">
                      {concept.note}
                    </p>
                  )}

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {COMPANIES.map((company) => (
                      <div
                        key={company.companyUrl}
                        className="rounded-2xl border border-border/70 bg-background/60 p-4"
                      >
                        <p className="mb-4 font-mono text-xs text-muted-foreground">
                          {company.companyName} ·{" "}
                          {company.companyUrl.replace("https://", "")}
                        </p>
                        <div
                          className="grid gap-4"
                          style={{
                            gridTemplateColumns: concept.wide
                              ? "minmax(0, 1fr)"
                              : `repeat(${concept.sizes.length}, minmax(0, 1fr))`,
                          }}
                        >
                          {concept.sizes.map((size) => (
                            <Stage
                              key={size}
                              label={SIZE_LABEL[size] ?? `${size}px`}
                            >
                              <concept.Component
                                companyUrl={company.companyUrl}
                                companyName={company.companyName}
                                size={size}
                              />
                            </Stage>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <footer className="mt-16 rounded-[1.75rem] border border-border bg-muted/30 p-6 text-sm leading-6 text-muted-foreground">
          Give feedback by number (e.g. &ldquo;6 and 15, but drop the
          neighbour dots&rdquo;). If none of these land, say which category
          feels least wrong and I&rsquo;ll generate a fresh set in that
          language only.
        </footer>
      </div>
    </div>
  )
}
