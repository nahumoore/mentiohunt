import { OpenRouter } from "@openrouter/agent"

import { DEFAULT_GENERATE_TEXT_MODEL, type OpenRouterModel } from "./models"

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
    }
  }>
  usage?: {
    cost?: number
  }
  error?: {
    message?: string
  }
}

async function callModel(
  modelId: string,
  messages: Array<{ role: "system" | "user"; content: string }>,
  responseFormat: Required<Pick<GenerateTextOptions, "responseFormat">>["responseFormat"],
  thinkingBudget: number | undefined,
  timeoutMs: number
): Promise<{ text: string; cost: number }> {
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

  const data = (await response.json().catch(() => null)) as
    | ChatCompletionResponse
    | null

  if (!response.ok) {
    throw new Error(
      data?.error?.message ?? `OpenRouter request failed: ${response.status}`
    )
  }

  const content = data?.choices?.[0]?.message?.content
  const cost = data?.usage?.cost ?? 0

  if (typeof content === "string") {
    return { text: content, cost }
  } else if (content !== undefined && content !== null) {
    return { text: JSON.stringify(content), cost }
  } else {
    throw new Error(
      `OpenRouter response did not include text content: ${JSON.stringify(data)}`
    )
  }
}

async function generateStructuredText({
  model,
  fallbackModels,
  input,
  systemInstructions,
  thinkingBudget,
  timeoutMs = 30_000,
  responseFormat,
}: Required<Pick<GenerateTextOptions, "model" | "input" | "responseFormat">> &
  Pick<GenerateTextOptions, "fallbackModels" | "systemInstructions" | "thinkingBudget" | "timeoutMs">): Promise<{ text: string; cost: number }> {
  const messages = [
    ...(systemInstructions
      ? [{ role: "system" as const, content: systemInstructions }]
      : []),
    { role: "user" as const, content: input },
  ]

  const modelsToTry = [model, ...(fallbackModels ?? [])]
  let lastErr: unknown

  for (const modelId of modelsToTry) {
    try {
      return await callModel(modelId, messages, responseFormat, thinkingBudget, timeoutMs)
    } catch (err) {
      lastErr = err
    }
  }

  throw lastErr
}

export async function generateText({
  model = DEFAULT_GENERATE_TEXT_MODEL,
  fallbackModels,
  input,
  systemInstructions,
  thinkingBudget,
  timeoutMs,
  responseFormat,
}: GenerateTextOptions): Promise<string> {
  if (responseFormat) {
    const { text } = await generateStructuredText({
      model,
      fallbackModels,
      input,
      systemInstructions,
      thinkingBudget,
      timeoutMs,
      responseFormat,
    })
    return text
  }

  const openrouter = new OpenRouter({
    apiKey: getOpenRouterApiKey(),
  })

  const result = openrouter.callModel({
    model,
    input,
    instructions: systemInstructions,
  })

  return await result.getText()
}

export async function generateTextWithUsage({
  model = DEFAULT_GENERATE_TEXT_MODEL,
  fallbackModels,
  input,
  systemInstructions,
  thinkingBudget,
  timeoutMs,
  responseFormat,
}: GenerateTextOptions): Promise<{ text: string; cost: number }> {
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
  return { text, cost: 0 }
}
