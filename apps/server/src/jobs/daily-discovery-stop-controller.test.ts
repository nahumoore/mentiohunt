import assert from "node:assert/strict"
import test from "node:test"
import type { RotationHistoryRun } from "../methods/prospect-generation-methods/shared/strategy-rotation.js"
import {
  configurationReasonForSourceSkips,
  DailyDiscoveryStopController,
} from "./daily-discovery-stop-controller.js"

function run(strategy: string, ready: number, attempts: number, costUsd = 0.1): RotationHistoryRun {
  return {
    strategy,
    started_at: "2026-08-26T12:00:00.000Z",
    status: "completed",
    prospects_created: attempts,
    cost_usd: costUsd,
    metadata: { enriched_with_contact: ready, enrichment_attempts: attempts },
    error: null,
  }
}

test("estimates attempts from the ready target and conservative conversion rate", () => {
  const controller = new DailyDiscoveryStopController(25, 23, 40, 0.7)
  const allocation = controller.allocate("listicle_roundup", {
    history: [run("listicle_roundup", 8, 10)],
  })

  assert.equal(allocation?.attemptLimit, 4)
})

test("caps resource pages while a higher-yield source remains runnable", () => {
  const controller = new DailyDiscoveryStopController(25, 0, 40, 0.7)
  const allocation = controller.allocate("resource_page_inclusion", {
    history: [run("resource_page_inclusion", 2, 10)],
    higherYieldSourceRunnable: true,
  })

  assert.equal(allocation?.attemptLimit, 8)
})

test("uses a small bounded allocation for a recovered-source probe", () => {
  const controller = new DailyDiscoveryStopController(25, 0, 80, 0.7)
  const allocation = controller.allocate("unlinked_mention", {
    history: [run("unlinked_mention", 0, 20)],
    explorationProbe: true,
  })

  assert.equal(allocation?.attemptLimit, 5)
})

test("commits only attempts consumed from a source-local budget", () => {
  const controller = new DailyDiscoveryStopController(25, 0, 20, 0.7)
  const allocation = controller.allocate("listicle_roundup", {
    history: [run("listicle_roundup", 10, 20)],
  })!
  allocation.attemptBudget.remaining -= 3

  assert.equal(controller.commit(allocation, 0.12), 3)
  assert.equal(controller.attemptsRemaining, 17)
  assert.equal(controller.costRemainingUsd, 0.58)
})

test("reports the shared stop signal before another source starts", () => {
  const controller = new DailyDiscoveryStopController(25, 25, 40, 0.7)
  assert.equal(controller.stopReason, "target_reached")
  assert.equal(controller.allocate("listicle_roundup", { history: [] }), null)
})

test("every source receives a target- and attempt-bounded allocation", () => {
  const strategies = [
    "competitor_backlink",
    "unlinked_mention",
    "listicle_roundup",
    "resource_page_inclusion",
    "broken_link_building",
  ]

  for (const strategy of strategies) {
    const controller = new DailyDiscoveryStopController(25, 22, 2, 0.7)
    const allocation = controller.allocate(strategy, { history: [] })
    assert.ok(allocation)
    assert.ok(allocation.attemptLimit <= 2, strategy)
    assert.ok(allocation.attemptLimit <= 3, strategy)
  }
})

test("cost affordability prevents a source from starting an oversized batch", () => {
  const controller = new DailyDiscoveryStopController(25, 0, 80, 0.015)
  const allocation = controller.allocate("listicle_roundup", { history: [] })

  assert.equal(allocation?.attemptLimit, 1)
})

test("returns a precise reason for a broken-link-only configuration", () => {
  assert.equal(
    configurationReasonForSourceSkips(
      ["broken_link_building"],
      [{
        strategy: "broken_link_building",
        skipReason: "broken_link_requires_valid_competitor",
      }]
    ),
    "broken_link_requires_valid_competitor"
  )
})

test("does not classify cadence skips as configuration errors", () => {
  assert.equal(
    configurationReasonForSourceSkips(
      ["broken_link_building"],
      [{
        strategy: "broken_link_building",
        skipReason: "broken_link_weekly_scan_not_due",
      }]
    ),
    undefined
  )
})
