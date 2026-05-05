const personas = [
  {
    title: "SaaS Founders",
    description:
      "Building backlinks without an SEO agency. You publish content or are starting SEO seriously and want a simple weekly queue of actionable opportunities.",
    traits: [
      "Have a live SaaS, tool, newsletter, or content site",
      "Understand that backlinks matter for SEO",
      "Want to avoid manual Google searches",
    ],
  },
  {
    title: "Indie Founders",
    description:
      "Self-serve backlink prospecting as part of your growth stack. You prefer software over hiring a link-building agency.",
    traits: [
      "Have at least 3-10 known competitors",
      "Already publish content or are starting SEO",
      "Willing to pay $49-$99/month for recurring value",
    ],
  },
  {
    title: "Small Agencies",
    description:
      "Need repeatable backlink prospecting for multiple clients. You want to move beyond one-time scans to recurring discovery.",
    traits: [
      "Manage SEO for 2-5 client sites",
      "Want a simple weekly queue per client",
      "Need outreach prep that scales",
    ],
  },
]

export function TargetPersonas() {
  return (
    <section
      id="target-personas"
      className="bg-background py-20 sm:py-24 lg:py-28"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[42px]">
            Who Mentiohunt is for
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Built for founders and small teams who want recurring backlink
            opportunities, not vanity metrics.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {personas.map((persona) => (
            <div
              key={persona.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="font-heading text-xl font-semibold tracking-tight">
                {persona.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {persona.description}
              </p>
              <ul className="mt-5 space-y-2">
                {persona.traits.map((trait) => (
                  <li
                    key={trait}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" />
                    {trait}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
