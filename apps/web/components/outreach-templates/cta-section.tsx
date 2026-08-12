import { AutomationCta } from "@/components/free-tools"

export function OutreachTemplateCtaSection() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <AutomationCta
          eyebrow="Beyond the template"
          heading="Or let the sending run itself."
          body="We find the sites your articles belong on, write the email, and schedule outreach automatically. You monitor the queue and cancel anything that isn't a fit — every opportunity comes with a fit rationale."
          ctaLabel="Get first opportunities"
          ctaHref="/signup"
          helperText="No credit card · first opportunities in 7 days"
        />
      </div>
    </section>
  )
}
