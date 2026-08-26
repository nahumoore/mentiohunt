import assert from "node:assert/strict"
import test from "node:test"
import { matchCompetitorTargetPage, type CompetitorTargetPage } from "./match-target-page.js"

const pages: CompetitorTargetPage[] = [
  {
    id: "analytics",
    url: "https://customer.test/product-analytics",
    title: "Product analytics guide",
    priority: 2,
    keywords: ["product analytics"],
    matchedKeywords: ["analytics"],
  },
  {
    id: "retention",
    url: "https://customer.test/customer-retention",
    title: "Customer retention playbook",
    priority: 1,
    keywords: ["customer retention"],
    matchedKeywords: ["retention"],
  },
]

test("matches a competitor destination to the topically closest customer page", () => {
  const match = matchCompetitorTargetPage(
    {
      urlTo: "https://competitor.test/guides/analytics",
      anchor: "product analytics guide",
      title: "Recommended analytics resources",
      textPre: "Measure activation using this",
      textPost: "for SaaS teams",
    },
    pages
  )
  assert.equal(match?.id, "analytics")
})

test("uses customer priority as the fallback when topical overlap ties", () => {
  const match = matchCompetitorTargetPage(
    { urlTo: "", anchor: "", title: "", textPre: "", textPost: "" },
    pages
  )
  assert.equal(match?.id, "retention")
})
