import type { BucketStat } from "./types"

export function bucketReplyRate(b: BucketStat): number {
  return b.sends > 0 ? b.replies / b.sends : 0
}

/**
 * Share of *contacted prospects* that had replied by the end of each step —
 * the honest way to show follow-up lift, since per-step reply rates flatter
 * later steps (only the least responsive prospects are still in the
 * sequence by then). Derived from `sequenceStepLift` rather than stored,
 * so it can never drift out of sync with the per-step numbers.
 */
export function deriveSequenceCumulative(
  steps: BucketStat[]
): { label: string; replies: number }[] {
  return steps.reduce<{ label: string; replies: number }[]>(
    (acc, step, index) => {
      const previous = index > 0 ? (acc[index - 1]?.replies ?? 0) : 0
      acc.push({
        label: `After step ${index + 1}`,
        replies: previous + step.replies,
      })
      return acc
    },
    []
  )
}
