import assert from "node:assert/strict"
import test from "node:test"
import {
  applyDomainRatingFloor,
  applyRelevanceFloor,
  pickBestCandidateForDomain,
  type Candidate,
} from "./find-backlink-opportunities-by-url.js"

function makeCandidate(url: string): Candidate {
  return {
    id: url,
    domain: "example.com",
    url,
    title: "",
    snippet: "",
    niche: "niche",
    query: "query",
    footprintLabel: "label",
    type: "Niche Blog",
  }
}

test("relevance floor drops scores below it and keeps scores at or above it", () => {
  const scored = [
    { item: "a", score: 49 },
    { item: "b", score: 50 },
    { item: "c", score: 0 },
    { item: "d", score: 100 },
  ]

  const result = applyRelevanceFloor(scored, 50)

  assert.deepEqual(
    result.map((r) => r.item),
    ["b", "d"]
  )
})

test("domain rating floor drops known-low DR and keeps known-high DR", () => {
  const candidates = [{ domain: "low.com" }, { domain: "high.com" }]
  const drByDomain = new Map<string, number | null>([
    ["low.com", 12],
    ["high.com", 15],
  ])

  const result = applyDomainRatingFloor(candidates, drByDomain, 15)

  assert.deepEqual(
    result.map((c) => c.domain),
    ["high.com"]
  )
})

test("domain rating floor keeps a domain whose DR lookup is null or missing", () => {
  const candidates = [{ domain: "null-dr.com" }, { domain: "missing.com" }]
  const drByDomain = new Map<string, number | null>([["null-dr.com", null]])

  const result = applyDomainRatingFloor(candidates, drByDomain, 15)

  assert.deepEqual(
    result.map((c) => c.domain),
    ["null-dr.com", "missing.com"]
  )
})

test("domain rating floor is a no-op when the DR map is empty (e.g. no Ahrefs key configured)", () => {
  const candidates = [{ domain: "a.com" }, { domain: "b.com" }]
  const result = applyDomainRatingFloor(candidates, new Map(), 15)
  assert.equal(result.length, 2)
})

test("picks the more specific article-style path over a domain root", () => {
  const root = makeCandidate("https://example.com/")
  const article = makeCandidate("https://example.com/blog/best-crm-tools-2026")
  assert.equal(pickBestCandidateForDomain(root, article), article)
  assert.equal(pickBestCandidateForDomain(article, root), article)
})

test("picks an article-style path over a bare resources/blog hub", () => {
  const hub = makeCandidate("https://example.com/resources")
  const article = makeCandidate("https://example.com/resources/best-crm-tools")
  assert.equal(pickBestCandidateForDomain(hub, article), article)
})
