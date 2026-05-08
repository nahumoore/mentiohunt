import { OpenRouter } from "@openrouter/agent"

import { DEFAULT_TEXT_MODEL, type OpenRouterModel } from "./models.js"

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
}

export async function generateText({
  model = DEFAULT_TEXT_MODEL,
  input,
  systemInstructions,
}: GenerateTextOptions) {
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
