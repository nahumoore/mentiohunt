import { OpenRouter } from "@openrouter/agent"
import pLimit, { type LimitFunction } from "p-limit"

import { DEFAULT_GENERATE_TEXT_MODEL, OPENROUTER_MODELS, type OpenRouterModel } from "./models.ts"

/**
 * Thrown when every model in the primary+fallback chain fails (e.g. all of
 * them reject with "Insufficient credits" during an OpenRouter balance
 * outage). Distinct from a single model's transient error so callers that
 * retry-then-swallow (see helpers/llm-retry.ts) can tell "the LLM never ran"
 * apart from "the LLM ran and scored this low" instead of treating both as
 * an ordinary zero result.
 */
export class LlmAllModelsFailedError extends Error {
  attemptErrors: string[]

  constructor(attemptErrors: string[]) {
    super(`All models failed — ${attemptErrors.join(" | ")}`)
    this.name = "LlmAllModelsFailedError"
    this.attemptErrors = attemptErrors
  }
}

type ProcessEnv = {
  env?: Record<string, string | undefined>
}

const processEnv = (globalThis as typeof globalThis & { process?: ProcessEnv })
  .process?.env

function getOpenRouterApiKey() {
  const apiKey = processEnv?.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY")
  }

  return apiKey
}

/**
 * Process-wide cap on in-flight requests per model, shared across every scorer
 * and call site that goes through this wrapper. Without this, each scorer's own
 * local pLimit(4-5) is independent — overlapping runs (e.g. daily discovery's
 * PRODUCT_CONCURRENCY x per-scorer pLimit) stack up and hammer whichever model
 * is primary all at once, which reads as that model "degrading" when it's really
 * self-inflicted burst pressure. Keyed by model ID so the cap follows the model
 * wherever it's used — primary or fallback — not the call site.
 *
 * Queueing here is free: callModel() creates its AbortSignal.timeout(...) after
 * this limiter resolves, so time spent queued doesn't burn the request's own
 * timeout budget (same reasoning as apps/server/src/helpers/scraper-limits.ts).
 */
const MODEL_CONCURRENCY = Number(processEnv?.LLM_MODEL_CONCURRENCY ?? 8)

/**
 * A flat cap is only safe for models with a deep OpenRouter provider pool.
 * Checked live via OpenRouter's public `/models/{model}/endpoints` API
 * (2026-07-24): under our `provider.require_parameters: true` filter (we
 * always send structured_outputs + reasoning together), qwen3.6-flash has
 * exactly 1 eligible provider (Alibaba — it's their own model, not rehosted
 * elsewhere) and glm-4.7-flash has 2 (DeepInfra, Cloudflare). deepseek-v4-pro
 * and gpt-5.6-luna both have 5+ and were left at the default. A cap of 8 is
 * trivial to a 7-provider pool but can saturate a 1-provider one outright —
 * this is why the flat cap shipped 2026-07-21 had no effect on the recurrence.
 */
const MODEL_CONCURRENCY_OVERRIDES: Partial<Record<OpenRouterModel, number>> = {
  [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH]: 2,
  [OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH]: 3,
}

const modelLimiters = new Map<string, LimitFunction>()

function limiterFor(modelId: string): LimitFunction {
  let limit = modelLimiters.get(modelId)
  if (!limit) {
    const cap = MODEL_CONCURRENCY_OVERRIDES[modelId as OpenRouterModel] ?? MODEL_CONCURRENCY
    limit = pLimit(cap)
    modelLimiters.set(modelId, limit)
  }
  return limit
}

export type GenerateTextOptions = {
  model?: OpenRouterModel
  fallbackModels?: OpenRouterModel[]
  input: string
  systemInstructions?: string
  thinkingBudget?: number
  timeoutMs?: number
  responseFormat?: {
    type: "json_schema"
    json_schema: {
      name: string
      strict: boolean
      schema: Record<string, unknown>
    }
  }
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown
      reasoning?: unknown
    }
    finish_reason?: string | null
  }>
  usage?: {
    cost?: number
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  error?: {
    message?: string
  }
}

export type GenerateTextUsageMeta = {
  finishReason: string | null
  promptTokens: number | null
  completionTokens: number | null
}

export type GenerateTextModelMeta = {
  modelUsed: string
}

async function callModel(
  modelId: string,
  messages: Array<{ role: "system" | "user"; content: string }>,
  responseFormat: Required<Pick<GenerateTextOptions, "responseFormat">>["responseFormat"],
  thinkingBudget: number | undefined,
  timeoutMs: number
): Promise<{ text: string; cost: number } & GenerateTextUsageMeta> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenRouterApiKey()}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model: modelId,
      messages,
      response_format: responseFormat,
      ...(thinkingBudget ? { reasoning: { max_tokens: thinkingBudget } } : {}),
      provider: { require_parameters: true },
      stream: false,
    }),
  })

  const rawText = await response.text()
  let data: ChatCompletionResponse | null = null
  try {
    data = rawText ? (JSON.parse(rawText) as ChatCompletionResponse) : null
  } catch {
    // data stays null; rawText is preserved for error reporting below.
  }

  if (!response.ok) {
    throw new Error(
      data?.error?.message ??
        `OpenRouter request failed: ${response.status} ${response.statusText}${rawText ? ` — ${rawText.slice(0, 500)}` : ""}`
    )
  }

  const choice = data?.choices?.[0]
  const message = choice?.message
  const content = message?.content
  const reasoning = message?.reasoning
  const cost = data?.usage?.cost ?? 0
  const usageMeta: GenerateTextUsageMeta = {
    finishReason: choice?.finish_reason ?? null,
    promptTokens: data?.usage?.prompt_tokens ?? null,
    completionTokens: data?.usage?.completion_tokens ?? null,
  }

  if (typeof content === "string" && content.length > 0) {
    return { text: content, cost, ...usageMeta }
  } else if (content !== undefined && content !== null) {
    return { text: JSON.stringify(content), cost, ...usageMeta }
  } else if (typeof reasoning === "string" && reasoning.length > 0) {
    // Reasoning models (e.g. z-ai/glm-4.7-flash) emit output in the reasoning field, content is null
    return { text: reasoning, cost, ...usageMeta }
  } else {
    throw new Error(
      `OpenRouter response did not include text content (status=${response.status}, finish_reason=${choice?.finish_reason ?? "unknown"}): ${rawText ? rawText.slice(0, 1000) : "<empty body>"}`
    )
  }
}

async function generateStructuredText({
  model,
  fallbackModels,
  input,
  systemInstructions,
  thinkingBudget,
  timeoutMs = 60_000,
  responseFormat,
}: Required<Pick<GenerateTextOptions, "model" | "input" | "responseFormat">> &
  Pick<GenerateTextOptions, "fallbackModels" | "systemInstructions" | "thinkingBudget" | "timeoutMs">): Promise<
  { text: string; cost: number } & GenerateTextUsageMeta & GenerateTextModelMeta
> {
  const messages = [
    ...(systemInstructions
      ? [{ role: "system" as const, content: systemInstructions }]
      : []),
    { role: "user" as const, content: input },
  ]

  const modelsToTry = [model, ...(fallbackModels ?? [])]
  const attemptErrors: string[] = []

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelId = modelsToTry[i]!
    const isFallback = i > 0
    try {
      const result = await limiterFor(modelId)(() =>
        callModel(modelId, messages, responseFormat, thinkingBudget, timeoutMs)
      )
      if (isFallback) {
        console.warn(`[openrouter] fallback model succeeded: ${modelId} (primary: ${modelsToTry[0]})`)
      }
      return { ...result, modelUsed: modelId }
    } catch (err) {
      attemptErrors.push(`${modelId}: ${String(err)}`)
      if (isFallback) {
        console.warn(`[openrouter] fallback model failed: ${modelId} — ${String(err)}`)
      } else if (modelsToTry.length > 1) {
        console.warn(`[openrouter] primary model failed, trying fallback: ${modelId} — ${String(err)}`)
      }
    }
  }

  throw new LlmAllModelsFailedError(attemptErrors)
}

export async function generateText({
  model = DEFAULT_GENERATE_TEXT_MODEL,
  fallbackModels,
  input,
  systemInstructions,
  thinkingBudget,
  timeoutMs,
  responseFormat,
}: GenerateTextOptions): Promise<{ text: string } & GenerateTextModelMeta> {
  if (responseFormat) {
    const { text, modelUsed } = await generateStructuredText({
      model,
      fallbackModels,
      input,
      systemInstructions,
      thinkingBudget,
      timeoutMs,
      responseFormat,
    })
    return { text, modelUsed }
  }

  const openrouter = new OpenRouter({
    apiKey: getOpenRouterApiKey(),
  })

  const result = openrouter.callModel({
    model,
    input,
    instructions: systemInstructions,
  })

  const text = await result.getText()
  return { text, modelUsed: model }
}

export async function generateTextWithUsage({
  model = DEFAULT_GENERATE_TEXT_MODEL,
  fallbackModels,
  input,
  systemInstructions,
  thinkingBudget,
  timeoutMs,
  responseFormat,
}: GenerateTextOptions): Promise<
  { text: string; cost: number } & Partial<GenerateTextUsageMeta> & GenerateTextModelMeta
> {
  if (responseFormat) {
    return generateStructuredText({
      model,
      fallbackModels,
      input,
      systemInstructions,
      thinkingBudget,
      timeoutMs,
      responseFormat,
    })
  }

  const openrouter = new OpenRouter({
    apiKey: getOpenRouterApiKey(),
  })

  const result = openrouter.callModel({
    model,
    input,
    instructions: systemInstructions,
  })

  const text = await result.getText()
  return { text, cost: 0, modelUsed: model }
}
