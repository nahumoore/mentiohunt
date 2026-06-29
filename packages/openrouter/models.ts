export const OPENROUTER_MODELS = {
  // Gemini 2.5 Flash Lite.
  // OpenRouter page: https://openrouter.ai/google/gemini-2.5-flash-lite
  // Description: lightweight reasoning model optimized for low latency and cost efficiency.
  // Pricing: $0.10 / 1M input tokens, $0.40 / 1M output tokens.
  // Context window: 1,048,576 tokens.
  GOOGLE_GEMINI_2_5_FLASH_LITE:
    "google/gemini-2.5-flash-lite",

  // Gemini 2.5 Flash.
  // OpenRouter page: https://openrouter.ai/google/gemini-2.5-flash
  // Description: well-rounded multimodal model with strong reasoning capabilities.
  // Pricing: $0.30 / 1M input tokens, $2.50 / 1M output tokens.
  // Context window: 1,048,576 tokens.
  GOOGLE_GEMINI_2_5_FLASH:
    "google/gemini-2.5-flash",

  // Anthropic Claude Haiku 4.5.
  // OpenRouter page: https://openrouter.ai/anthropic/claude-haiku-4.5
  // Description: fastest and most efficient Claude model, near-frontier intelligence at low cost and latency.
  // Pricing: $1.00 / 1M input tokens, $5.00 / 1M output tokens.
  // Context window: 200,000 tokens.
  ANTHROPIC_CLAUDE_HAIKU_4_5: "anthropic/claude-haiku-4.5",

  // OpenAI gpt-oss-120b.
  // OpenRouter page: https://openrouter.ai/openai/gpt-oss-120b
  // Description: open-weight MoE model for high-reasoning and general-purpose production use cases.
  // Pricing: $0.039 / 1M input tokens, $0.18 / 1M output tokens.
  // Context window: 131,072 tokens.
  OPENAI_GPT_OSS_120B: "openai/gpt-oss-120b",

  // DeepSeek V4 Pro.
  // OpenRouter page: https://openrouter.ai/deepseek/deepseek-v4-pro
  // Description: DeepSeek reasoning model for capable production chat and extraction use cases.
  // Pricing: see OpenRouter model page.
  // Context window: see OpenRouter model page.
  DEEPSEEK_DEEPSEEK_V4_PRO: "deepseek/deepseek-v4-pro",

  // Z AI GLM-5.
  // OpenRouter page: https://openrouter.ai/z-ai/glm-5
  // Description: Z AI's GLM-5 language model.
  // Pricing: see OpenRouter model page.
  // Context window: see OpenRouter model page.
  Z_AI_GLM_5: "z-ai/glm-5",
} as const

export type OpenRouterModel =
  (typeof OPENROUTER_MODELS)[keyof typeof OPENROUTER_MODELS]

export const DEFAULT_GENERATE_TEXT_MODEL = OPENROUTER_MODELS.OPENAI_GPT_OSS_120B
