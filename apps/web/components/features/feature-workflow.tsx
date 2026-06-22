import { IconChecks } from "@tabler/icons-react"

import type { FeaturePage } from "@/consts/features"

type Props = {
  feature: Pick<FeaturePage, "keyword" | "inputs" | "workflow" | "outcomes">
}

export function FeatureWorkflow({ feature }: Props) {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-princeton-orange/7 blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            How it works
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            A focused workflow for {feature.keyword}.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Better inputs lead to clearer scoring and a prepared action — not
            another blank spreadsheet.
          </p>
        </div>

        {/* Inputs + workflow steps */}
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Inputs */}
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-7">
            <p className="font-heading text-2xl font-semibold tracking-[-0.045em]">
              Inputs that improve discovery
            </p>
            <div className="mt-6 space-y-3">
              {feature.inputs.map((input) => (
                <div key={input} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                    <IconChecks size={16} stroke={2.5} />
                  </span>
                  <span className="text-sm leading-6 text-muted-foreground">
                    {input}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow steps */}
          <div className="grid gap-4">
            {feature.workflow.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.7rem] border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-foreground font-heading text-sm font-semibold text-background">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-heading text-xl font-semibold tracking-[-0.035em]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outcomes */}
        <div className="mx-auto mt-6 max-w-6xl rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-7">
          <p className="font-heading text-2xl font-semibold tracking-[-0.045em]">
            What you get
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {feature.outcomes.map((outcome) => (
              <div key={outcome} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-blaze-orange)]/10 text-[var(--color-princeton-orange)]">
                  <IconChecks size={16} stroke={2.5} />
                </span>
                <span className="text-sm leading-6 text-muted-foreground">
                  {outcome}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
