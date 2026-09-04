import assert from "node:assert/strict"
import test from "node:test"
import { isSpammyLinkPage } from "./url-filters.js"

test("drops PBN / backlink-selling title phrasing", () => {
  assert.equal(
    isSpammyLinkPage({
      url: "https://example.com/blog/rankings",
      title: "🏆🏆Boost your Google rankings with Premium PBN",
    }),
    true
  )
  assert.equal(
    isSpammyLinkPage({
      url: "https://example.com/shop",
      title: "Where to buy 🚀 aged domains and backlinks",
    }),
    true
  )
  assert.equal(
    isSpammyLinkPage({ url: "https://example.com/x", title: "High DA Backlinks For Sale — Cheap!" }),
    true
  )
})

test("drops emoji-stuffed titles even without spam phrasing", () => {
  assert.equal(
    isSpammyLinkPage({ url: "https://example.com/x", title: "🔥🔥 Amazing tools you need 🔥🔥" }),
    true
  )
})

test("a single emoji alone is not enough to flag a title", () => {
  assert.equal(
    isSpammyLinkPage({ url: "https://example.com/x", title: "🚀 Our 2026 product roadmap" }),
    false
  )
})

test("drops opaque hashed/opaque path shapes", () => {
  assert.equal(
    isSpammyLinkPage({
      url: "https://example.com/page-3f9c1b8e2a7d4560f1e2d3c4b5a69788.html",
      title: "Untitled",
    }),
    true
  )
  assert.equal(
    isSpammyLinkPage({ url: "https://example.com/all/12/34.html", title: "Untitled" }),
    true
  )
  assert.equal(
    isSpammyLinkPage({
      url: "https://example.com/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
      title: "Untitled",
    }),
    true
  )
})

test("keeps legitimate editorial pages", () => {
  assert.equal(
    isSpammyLinkPage({
      url: "https://example.com/blog/best-crm-tools-for-real-estate",
      title: "The 12 Best CRM Tools for Real Estate Agents in 2026",
    }),
    false
  )
  assert.equal(
    isSpammyLinkPage({
      url: "https://example.com/resources",
      title: "Helpful resources for indie founders",
    }),
    false
  )
  assert.equal(
    isSpammyLinkPage({ url: "https://example.com/about", title: undefined }),
    false
  )
})
