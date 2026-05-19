import { OpenRouter } from "@openrouter/agent"

import { DEFAULT_GENERATE_TEXT_MODEL, type OpenRouterModel } from "./models.js"

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
  input: string
  systemInstructions?: string
  thinkingBudget?: number
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

async function generateStructuredText({
  model,
  input,
  systemInstructions,
  thinkingBudget,
  responseFormat,
}: Required<Pick<GenerateTextOptions, "model" | "input" | "responseFormat">> &
  Pick<GenerateTextOptions, "systemInstructions" | "thinkingBudget">): Promise<{ text: string; cost: number }> {
  const messages = [
    ...(systemInstructions
      ? [{ role: "system" as const, content: systemInstructions }]
      : []),
    { role: "user" as const, content: input },
  ]

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenRouterApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
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

  let text: string

  if (typeof content === "string") {
    text = content
  } else if (content !== undefined && content !== null) {
    text = JSON.stringify(content)
  } else {
    throw new Error("OpenRouter response did not include text content")
  }

  return { text, cost }
}

export async function generateText({
  model = DEFAULT_GENERATE_TEXT_MODEL,
  input,
  systemInstructions,
  thinkingBudget,
  responseFormat,
}: GenerateTextOptions): Promise<string> {
  if (responseFormat) {
    const { text } = await generateStructuredText({
      model,
      input,
      systemInstructions,
      thinkingBudget,
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
  input,
  systemInstructions,
  thinkingBudget,
  responseFormat,
}: GenerateTextOptions): Promise<{ text: string; cost: number }> {
  if (responseFormat) {
    return generateStructuredText({
      model,
      input,
      systemInstructions,
      thinkingBudget,
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
