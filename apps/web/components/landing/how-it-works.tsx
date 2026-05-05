import { Button } from "@workspace/ui/components/button"

const steps = [
  {
    number: "01",
    title: "Add your site and competitors",
    description: "Input your website, product description, target keywords, and 3-10 competitors you want to target.",
  },
  {
    number: "02",
    title: "Weekly discovery runs",
    description: "Our system scans for directories, resource pages, listicles, and competitor mention opportunities.",
  },
  {
    number: "03",
    title: "Review your ranked queue",
    description: "Each opportunity shows a fit score, rationale, suggested next step, and outreach angle you can act on.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background py-20 sm:py-24 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[42px]">
            How it works
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            From setup to ready-to-pitch opportunities in three steps.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <p className="font-heading text-sm font-medium tracking-wide text-muted-foreground">
                {step.number}
              </p>
              <h3 className="mt-3 font-heading text-xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild>
            <a href="#queue-preview">See the Queue in Action</a>
          </Button>
        </div>
      </div>
    </section>
  )
}