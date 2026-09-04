import assert from "node:assert/strict"
import test from "node:test"
import { assessCompetitorConfidence } from "./generate-competitors.js"

test("low confidence when homepage text is too thin", () => {
  assert.equal(assessCompetitorConfidence(50, 3), "low")
  assert.equal(assessCompetitorConfidence(299, 5), "low")
})

test("low confidence when fewer than 2 competitors survive filtering", () => {
  assert.equal(assessCompetitorConfidence(1000, 0), "low")
  assert.equal(assessCompetitorConfidence(1000, 1), "low")
})

test("high confidence with substantial homepage text and enough survivors", () => {
  assert.equal(assessCompetitorConfidence(500, 2), "high")
  assert.equal(assessCompetitorConfidence(2000, 3), "high")
})
