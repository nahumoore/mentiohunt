import { generateText } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { extractPageContent } from "../../../helpers/html-extract.js"
import { createLogger } from "../../../helpers/logger.js"

const log = createLogger("generate-backlink-competitors")

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["competitors"],
  properties: {
    competitors: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "string",
      },
    },
  },
} as const

const systemInstructions = [
  "You identify direct SEO competitors for a website based on its homepage.",
  "Return JSON only.",
  "Rules:",
  "- Return 3 to 5 unique root domains of real companies or products competing for the same audience and search intent.",
  "- Return root domains only, never full URLs, paths, protocols, or 'www.'.",
  "- Exclude marketplaces, review sites, publishers, directories, agencies, and social networks unless they are clearly direct product competitors.",
  "- Exclude the input site itself.",
  "- Prefer businesses a user would actually compare side by side with this site.",
].join("\n")

function normalizeDomain(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) return ""

  try {
    return new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
      .hostname.replace(/^www\./i, "")
      .toLowerCase()
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "")
      .toLowerCase()
  }
}

async function readWebsite(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "MentiohuntBot/1.0 (+https://mentiohunt.com)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch website: ${response.status}`)
  }

  const html = await response.text()
  return extractPageContent(html)
}

export async function generateCompetitorDomains(websiteUrl: string): Promise<string[]> {
  const websiteDomain = normalizeDomain(websiteUrl)
  const page = await readWebsite(websiteUrl)

  log.info("website loaded", {
    websiteDomain,
    title: page.title,
    descriptionLength: page.description.length,
    textLength: page.text.length,
  })

  const input = [
    `Website URL: ${websiteUrl}`,
    `Website domain: ${websiteDomain}`,
    `Homepage title: ${page.title || ""}`,
    `Homepage meta description: ${page.description || ""}`,
    `Homepage body text: ${page.text || ""}`,
  ].join("\n")

  const { text, modelUsed } = await generateText({
    model: OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO,
    fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH],
    systemInstructions,
    input,
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "competitor_domains",
        strict: true,
        schema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
      },
    },
    timeoutMs: 30_000,
  })

  const parsed = JSON.parse(text) as { competitors?: unknown }
  const rawCompetitors = Array.isArray(parsed.competitors) ? parsed.competitors : []

  const competitors = Array.from(
    new Set(
      rawCompetitors
        .filter((value): value is string => typeof value === "string")
        .map(normalizeDomain)
        .filter((domain) => domain && domain !== websiteDomain)
    )
  ).slice(0, 3)

  if (competitors.length === 0) {
    throw new Error("Failed to generate competitors")
  }

  log.info("competitors generated", { websiteDomain, competitors, model: modelUsed })

  return competitors
}
