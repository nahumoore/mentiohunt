#!/usr/bin/env node

import fs from "node:fs/promises"

const migrationPath = process.argv[2] ?? "supabase/migrations/20260819140000_import_outrank_directory_candidates.sql"
const concurrency = 8
const timeoutMs = 15_000

const source = await fs.readFile(migrationPath, "utf8")
const rowPattern = /^\s*\('(.+)', '([^']+)', 'directory', (NULL|\d+), '([^']*)'\),?$/gm
const directories = [...source.matchAll(rowPattern)].map((match) => ({
  name: match[1].replaceAll("''", "'"),
  domain: match[2],
  submitUrl: match[4],
}))

if (directories.length !== 56) {
  throw new Error(`Expected 56 directory rows, found ${directories.length}`)
}

const freePatterns = [
  /free\s+(?:directory\s+)?(?:listing|submission|submit)/i,
  /submit(?:ting)?\s+(?:is\s+)?free/i,
  /free\s+to\s+(?:list|submit)/i,
  /no\s+(?:cost|fee)\s+(?:to\s+)?(?:list|submit)/i,
]

const paidPatterns = [
  /paid\s+(?:directory\s+)?(?:listing|submission)/i,
  /payment\s+(?:is\s+)?required/i,
  /sponsored\s+(?:listing|profile)/i,
  /featured\s+(?:listing|profile)\s+(?:starts|from)/i,
  /(?:listing|submission)\s+(?:fee|price|cost)/i,
  /(?:listing|submission|directory)[\s\S]{0,80}[$€£]\s*(?:[1-9]\d*|0?\.\d*[1-9])(?:\.\d{2})?/i,
  /[$€£]\s*(?:[1-9]\d*|0?\.\d*[1-9])(?:\.\d{2})?[\s\S]{0,80}(?:listing|submission|directory)/i,
]

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function findSignal(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[0]
  }
  return null
}

function classify(text) {
  const freeSignal = findSignal(text, freePatterns)
  const paidSignal = findSignal(text, paidPatterns)

  if (freeSignal && !paidSignal) return { status: "free", signal: freeSignal }
  if (paidSignal && !freeSignal) return { status: "paid", signal: paidSignal }
  if (freeSignal && paidSignal) {
    return { status: "unknown", signal: `${freeSignal}; ${paidSignal}` }
  }
  return { status: "unknown", signal: "no explicit pricing signal" }
}

async function check(directory) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(directory.submitUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "MentiohuntBot/1.0 (+https://mentiohunt.com/bot)",
        accept: "text/html,application/xhtml+xml",
      },
    })
    const body = await response.text()
    const text = htmlToText(body)
    const classification = classify(text)

    return {
      ...directory,
      status: classification.status,
      httpStatus: response.status,
      finalUrl: response.url,
      signal: classification.signal,
    }
  } catch (error) {
    return {
      ...directory,
      status: "unknown",
      httpStatus: "error",
      finalUrl: "",
      signal: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timer)
  }
}

const results = []
for (let i = 0; i < directories.length; i += concurrency) {
  const batch = directories.slice(i, i + concurrency)
  results.push(...(await Promise.all(batch.map(check))))
}

const counts = results.reduce((summary, result) => {
  summary[result.status] += 1
  return summary
}, { free: 0, paid: 0, unknown: 0 })

console.log(JSON.stringify({ checked: results.length, counts }, null, 2))
console.log("name\tdomain\tstatus\thttp_status\tfinal_url\tsignal")
for (const result of results) {
  console.log([
    result.name,
    result.domain,
    result.status,
    result.httpStatus,
    result.finalUrl,
    result.signal.replaceAll("\t", " "),
  ].join("\t"))
}
