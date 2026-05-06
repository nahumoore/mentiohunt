export const OPENROUTER_MODELS = {
  // Mistral Small 3.
  // OpenRouter page: https://openrouter.ai/mistralai/mistral-small-24b-instruct-2501
  // Description: cheap and low latency.
  // Pricing: $0.05 / 1M input tokens, $0.08 / 1M output tokens.
  // Context window: 32,768 tokens.
  MISTRAL_SMALL_24B_INSTRUCT_2501:
    "mistralai/mistral-small-24b-instruct-2501",
} as const

export type OpenRouterModel =
  (typeof OPENROUTER_MODELS)[keyof typeof OPENROUTER_MODELS]

export const DEFAULT_TEXT_MODEL =
  OPENROUTER_MODELS.MISTRAL_SMALL_24B_INSTRUCT_2501
