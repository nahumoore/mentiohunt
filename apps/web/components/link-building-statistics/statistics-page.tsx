import { AutomationCta } from "@/components/free-tools"
import {
  REPLY_CLASSIFICATION,
  REPLY_RATE_BY_DOMAIN_RATING,
  REPLY_RATE_BY_RELEVANCE,
  SEQUENCE_STEP_LIFT,
  TIME_TO_FIRST_REPLY,
} from "@/app/link-building-statistics/_data"

import { BarList } from "./bar-list"
import { ClassificationSplit } from "./classification-split"
import { Hero } from "./hero"
import { Histogram } from "./histogram"
import { Overview } from "./overview"
import { StatSection } from "./section"
import { Toc } from "./toc"

export function LinkBuildingStatisticsPage() {
  return (
    <>
      <Hero />
      <Toc />

      <StatSection
        id="overview"
        eyebrow="Snapshot"
        title="The dataset at a glance"
        description="Every chart below breaks these totals down further — by site authority, fit, timing, and outcome."
        copyStat="Mentiohunt's automated backlink outreach converts 23.7% of sends into a reply"
      >
        <Overview />
      </StatSection>

      <StatSection
        id="by-domain-rating"
        eyebrow="Site authority"
        title="Reply rate by Domain Rating tier"
        description="Higher-authority sites reply more often — but the gap is smaller than most cold-email benchmarks suggest, since every prospect here was already matched for topical fit before outreach went out."
        copyStat="Prospects with DR 60+ reply to backlink outreach at 31.3%, more than double the DR 0-20 tier at 15.5%"
        minSampleNote="Tiers below 20 sends are flagged as insufficient sample rather than shown as a rate."
      >
        <BarList buckets={REPLY_RATE_BY_DOMAIN_RATING} />
      </StatSection>

      <StatSection
        id="by-relevance"
        eyebrow="Article-to-site fit"
        title="Reply rate by site relevance score"
        description="Mentiohunt scores how well each article fits a prospect site before outreach is sent. Fit predicts replies more strongly than Domain Rating alone — the core argument for matching over blasting."
        copyStat="Backlink prospects scored as a very high fit (0.9+) reply at 30.7%, over 3x the low-fit tier"
        minSampleNote="Tiers below 20 sends are flagged as insufficient sample rather than shown as a rate."
      >
        <BarList buckets={REPLY_RATE_BY_RELEVANCE} />
      </StatSection>

      <StatSection
        id="time-to-reply"
        eyebrow="Response timing"
        title="Time to first reply"
        description="Just over a quarter of all replies land within a day. Waiting past the two-week mark rarely pays off."
        copyStat="63.3% of backlink outreach replies arrive within the first 3 days of sending"
      >
        <Histogram data={TIME_TO_FIRST_REPLY} />
      </StatSection>

      <StatSection
        id="classification"
        eyebrow="Reply outcomes"
        title="What replies actually say"
        description="Not every reply is a placement opportunity. Roughly a fifth of inbound messages are automated out-of-office responses, not a real prospect reply."
        copyStat="43.5% of backlink outreach replies are genuinely interested, not just an auto-reply or a pass"
      >
        <ClassificationSplit data={REPLY_CLASSIFICATION} />
      </StatSection>

      <StatSection
        id="sequence-lift"
        eyebrow="Follow-up sequences"
        title="Does a follow-up email add replies?"
        description="Yes — but with steep diminishing returns. The first follow-up still adds meaningfully more replies; by the third, it's mostly noise."
        copyStat="A single follow-up email lifts backlink outreach replies by nearly 9%, on top of the initial send's 13.3%"
      >
        <BarList buckets={SEQUENCE_STEP_LIFT} />
      </StatSection>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <AutomationCta
            eyebrow="Where these prospects came from"
            heading="This data comes from Mentiohunt's autopilot backlink outreach."
            body="Mentiohunt finds sites where your content fits, sends outreach automatically, and hands the conversation to you the moment a prospect replies."
            ctaLabel="See how it works"
            ctaHref="/#how-it-works"
          />
        </div>
      </section>
    </>
  )
}
