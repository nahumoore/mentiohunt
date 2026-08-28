import assert from "node:assert/strict"
import test from "node:test"
import {
  claimPersistenceBudget,
  normalizeProspectDomain,
  selectUniqueProspectDomains,
} from "./persistence-policy.js"

test("normalizes hostnames consistently", () => {
  assert.equal(normalizeProspectDomain("HTTPS://WWW.Example.COM/path"), "example.com")
  assert.equal(normalizeProspectDomain("www.Example.com."), "example.com")
})

test("collapses subdomains to the registrable root domain", () => {
  assert.equal(normalizeProspectDomain("news.eu.example.co.uk"), "example.co.uk")
  assert.equal(normalizeProspectDomain("tenant.blogspot.com"), "tenant.blogspot.com")
})

test("keeps one candidate per normalized product domain", () => {
  const selection = selectUniqueProspectDomains(
    [
      { item: "first", foundUrl: "https://example.com/a", domain: "www.example.com" },
      { item: "second", foundUrl: "https://example.com/b", domain: "EXAMPLE.COM" },
      { item: "known", foundUrl: "https://known.com/a", domain: "known.com" },
      { item: "other", foundUrl: "https://other.com/a", domain: "other.com" },
    ],
    new Set(["www.known.com"])
  )

  assert.deepEqual(selection.selected.map((candidate) => candidate.item), ["first", "other"])
  assert.deepEqual(selection.selected.map((candidate) => candidate.domain), ["example.com", "other.com"])
  assert.equal(selection.duplicatesSkipped, 2)
})

test("claims attempt budget synchronously and in priority order", () => {
  const budget = { remaining: 2 }
  const candidates = ["one", "two", "three"].map((item) => ({
    item,
    foundUrl: `https://${item}.com`,
    domain: `${item}.com`,
  }))

  const result = claimPersistenceBudget(candidates, budget)

  assert.deepEqual(result.claimed.map((candidate) => candidate.item), ["one", "two"])
  assert.equal(result.budgetSkipped, 1)
  assert.equal(budget.remaining, 0)
})
