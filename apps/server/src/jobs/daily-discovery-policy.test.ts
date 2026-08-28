import assert from "node:assert/strict"
import test from "node:test"
import {
  DEFAULT_DAILY_DISCOVERY_SETTINGS,
  remainingDailyBudget,
  utcQuotaDate,
} from "./daily-discovery-policy.js"

test("uses the intended adaptive defaults for new products", () => {
  assert.deepEqual(DEFAULT_DAILY_DISCOVERY_SETTINGS, {
    adaptiveDiscoveryEnabled: true,
    target: 25,
    candidateCap: 40,
    attemptCap: 80,
    costCapUsd: 0.7,
  })
})

test("tops up a UTC-day target from persisted ready output", () => {
  assert.deepEqual(remainingDailyBudget(25, 80, 0.7, 18, 22, 0.2), {
    targetRemaining: 7,
    attemptsRemaining: 58,
    costRemainingUsd: 0.5,
  })
})

test("does no more work after the daily target is reached", () => {
  assert.equal(remainingDailyBudget(25, 80, 0.7, 25, 30, 0.3).targetRemaining, 0)
})

test("uses the UTC calendar date at a local-day boundary", () => {
  assert.equal(utcQuotaDate(new Date("2026-08-27T23:59:59.999Z")), "2026-08-27")
  assert.equal(utcQuotaDate(new Date("2026-08-28T00:00:00.000Z")), "2026-08-28")
})
