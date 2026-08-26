import assert from "node:assert/strict"
import test from "node:test"
import {
  getSendReadyCount,
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

test("orders target-filling sources by recent send-ready output per cost", () => {
  const history = [
    run({ strategy: "listicle_roundup", prospects_created: 5, metadata: { enriched_with_contact: 5 } }),
    run({ strategy: "resource_page_inclusion", prospects_created: 1, metadata: { enriched_with_contact: 1 } }),
  ]

  assert.deepEqual(
    orderStrategiesByEfficiency(["resource_page_inclusion", "listicle_roundup"], history),
    ["listicle_roundup", "resource_page_inclusion"]
  )
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
