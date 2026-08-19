import { IconClock, IconMessageCheck, IconSend, IconUsers } from "@tabler/icons-react"

import { StatCard } from "@/components/free-tools"
import { DATASET_META, OVERALL_REPLY_RATE } from "@/app/link-building-statistics/_data"

export function Overview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Outreach emails sent"
        value={DATASET_META.totalSent.toLocaleString()}
        icon={IconSend}
        tone="orange"
        footnote={`Across ${DATASET_META.distinctProducts} customer products`}
      />
      <StatCard
        label="Reply rate"
        value={`${(OVERALL_REPLY_RATE * 100).toFixed(1)}%`}
        icon={IconMessageCheck}
        tone="success"
        footnote={`${DATASET_META.uniqueRepliedProspects} of ${DATASET_META.totalSent} sends got a reply`}
      />
      <StatCard
        label="Prospects tracked"
        value={DATASET_META.totalProspects.toLocaleString()}
        icon={IconUsers}
        tone="orange"
        footnote={`${DATASET_META.prospectsWithDomainRating.toLocaleString()} with a Domain Rating on file`}
      />
      <StatCard
        label="Avg. time to first reply"
        value="3.7 days"
        icon={IconClock}
        tone="amber"
        footnote="Weighted across all first replies"
      />
    </div>
  )
}
