import assert from "node:assert/strict"
import test from "node:test"
import {
  getBrokenLinkCadenceDecision,
  getSendReadyCount,
  getStrategyPerformance,
  getUnlinkedMentionDecision,
  isStrategyCoolingDown,
  orderStrategiesByEfficiency,
  type RotationHistoryRun,
} from "./strategy-rotation.js"

function run(overrides: Partial<RotationHistoryRun>): RotationHistoryRun {
  return {
    strategy: "listicle_roundup",
    started_at: "2026-08-25T12:00:00.000Z",
    status: "completed",
    prospects_created: 0,
    cost_usd: 0.1,
    metadata: { health: "healthy" },
    error: null,
    ...overrides,
  }
}

test("reads send-ready output from either funnel naming convention", () => {
  assert.equal(getSendReadyCount(run({ metadata: { enriched_with_contact: 4 } })), 4)
  assert.equal(getSendReadyCount(run({ metadata: { enrichedWithContact: 3 } })), 3)
})

test("orders target-filling sources by expected ready output before cost", () => {
  const history = [
    run({
      strategy: "listicle_roundup",
      prospects_created: 10,
      cost_usd: 0.5,
      metadata: { sequence_ready: 8, enrichment_attempts: 10 },
    }),
    run({
      strategy: "resource_page_inclusion",
      prospects_created: 10,
      cost_usd: 0.01,
      metadata: { sequence_ready: 2, enrichment_attempts: 10 },
    }),
  ]

  assert.deepEqual(
    orderStrategiesByEfficiency(["resource_page_inclusion", "listicle_roundup"], history),
    ["listicle_roundup", "resource_page_inclusion"]
  )
})

test("performance uses sequence-ready output per enrichment attempt", () => {
  const performance = getStrategyPerformance([
    run({ metadata: { sequence_ready: 8, enrichment_attempts: 10 } }),
  ], "listicle_roundup")

  assert.equal(performance.expectedReadyOutput, 8)
  assert.ok(performance.readyPerAttempt > 0.7)
  assert.ok(performance.readyPerAttempt < 0.8)
})

test("adaptive cooldown depends on the source's elapsed time, not other source runs", () => {
  const history = [
    run({ started_at: "2026-08-25T12:00:00.000Z" }),
    run({ started_at: "2026-08-24T12:00:00.000Z" }),
    run({ strategy: "resource_page_inclusion", started_at: "2026-08-25T23:00:00.000Z" }),
  ]

  assert.equal(isStrategyCoolingDown(history, "listicle_roundup", new Date("2026-08-25T18:00:00.000Z")), true)
  assert.equal(isStrategyCoolingDown(history, "listicle_roundup", new Date("2026-08-26T13:00:00.000Z")), false)
})

test("partial zero-yield runs do not trigger cooldown", () => {
  const history = [
    run({ started_at: "2026-08-25T12:00:00.000Z", metadata: { health: "partial" } }),
    run({ started_at: "2026-08-24T12:00:00.000Z" }),
  ]

  assert.equal(isStrategyCoolingDown(history, "listicle_roundup", new Date("2026-08-25T18:00:00.000Z")), false)
})

test("low-volume unlinked mentions are re-probed after an elapsed cooldown", () => {
  const history = [
    run({
      strategy: "unlinked_mention",
      started_at: "2026-08-20T12:00:00.000Z",
      metadata: { candidates_gathered: 2 },
    }),
  ]

  assert.deepEqual(
    getUnlinkedMentionDecision(history, new Date("2026-08-22T12:00:00.000Z")),
    {
      shouldRun: false,
      explorationProbe: false,
      skipReason: "unlinked_mention_low_volume_probe_not_due",
    }
  )
  assert.deepEqual(
    getUnlinkedMentionDecision(history, new Date("2026-08-23T12:00:00.000Z")),
    { shouldRun: true, explorationProbe: true }
  )
})

test("broken links remain supplemental on a weekly cadence", () => {
  const history = [run({
    strategy: "broken_link_building",
    started_at: "2026-08-20T12:00:00.000Z",
  })]

  assert.equal(
    getBrokenLinkCadenceDecision(history, new Date("2026-08-26T12:00:00.000Z")).skipReason,
    "broken_link_weekly_scan_not_due"
  )
  assert.equal(
    getBrokenLinkCadenceDecision(history, new Date("2026-08-27T12:00:00.000Z")).shouldRun,
    true
  )
})
