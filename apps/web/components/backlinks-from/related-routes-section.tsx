import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

import { relatedResources } from "./data"

export function BacklinksFromRelatedRoutesSection() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 bottom-0 h-80 w-80 translate-x-1/4 rounded-full bg-princeton-orange/7 blur-[110px]" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            Related Routes
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Use this hub as the bridge between strategy and action.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            One resource should teach the workflow. Another should turn the
            workflow into a recurring queue. Both matter.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-[1fr_1fr]">
          {relatedResources.map((resource) => (
            <article
              key={resource.href}
              className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-7 shadow-sm"
            >
              <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-[var(--color-princeton-orange)] uppercase">
                {resource.label}
              </p>
              <h3 className="mt-3 max-w-md font-heading text-[2rem] font-semibold tracking-[-0.045em] text-balance">
                {resource.title}
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                {resource.description}
              </p>

              <Button
                asChild
                variant={resource.href === "/signup" ? "default" : "outline"}
                size="lg"
                className={
                  resource.href === "/signup"
                    ? "mt-7 h-11 rounded-full px-6 shadow-md shadow-primary/20"
                    : "mt-7 h-11 rounded-full border-[var(--color-blaze-orange)]/22 bg-background/70 px-6 hover:bg-[var(--color-blaze-orange)]/8"
                }
              >
                <Link href={resource.href}>
                  {resource.href === "/signup"
                    ? "Start for free"
                    : "Read the guide"}
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
