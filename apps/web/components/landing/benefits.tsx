const benefits = [
  {
    title: "Skip the Endless Google Searches",
    description:
      "No more clicking through page after page trying to find relevant directories, resource pages, or listicles. Mentiohunt surfaces opportunities that actually fit your product, so you stop hunting and start doing.",
  },
  {
    title: "Every Opportunity Has a Next Step",
    description:
      "Gone are the days of staring at a spreadsheet wondering what to do with each link. Each result tells you exactly how to approach it—whether that's submitting to a directory, pitching a listicle, or reaching out to a site owner.",
  },
  {
    title: "Know Why It Was Surfaced",
    description:
      "See the reasoning behind every recommendation. Mentiohunt shows you the fit—so you can prioritize opportunities that actually make sense for your site and skip the ones that don't.",
  },
  {
    title: "Outreach Angles That Feel Human",
    description:
      "Get suggested pitch ideas tailored to each opportunity. You're not copying generic templates; you're starting with a relevant angle that makes your outreach feel specific, not like automated spam.",
  },
  {
    title: "A Weekly Queue That Keeps You Organized",
    description:
      "Your backlink work shows up in your inbox (or dashboard) each week, ready to go. No more chasing opportunities, no more forgotten outreach—just a steady stream of actionable prospects.",
  },
]

export function Benefits() {
  return (
    <section id="benefits" className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[42px]">
            Stop Wasting Time on Backlink Research
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Mentiohunt turns your niche, keywords, and competitors into a weekly queue
            of qualified outreach opportunities—so you can focus on pitching instead of
            searching.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  className="size-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-heading text-lg font-semibold">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}