export const OPENROUTER_MODELS = {
  // DeepSeek V4 Pro.
  // OpenRouter page: https://openrouter.ai/deepseek/deepseek-v4-pro
  // Description: DeepSeek reasoning model for capable production chat and extraction use cases.
  // Pricing: $0.435 / 1M input tokens, $0.87 / 1M output tokens.
  // Context window: 1,000,000 tokens.
  DEEPSEEK_DEEPSEEK_V4_PRO: "deepseek/deepseek-v4-pro",

  // Z AI GLM 4.7 Flash.
  // OpenRouter page: https://openrouter.ai/z-ai/glm-4.7-flash
  // Description: 30B model balancing performance and efficiency, optimized for agentic coding and long-horizon tasks. Supports reasoning + structured output simultaneously.
  // Pricing: $0.06 / 1M input tokens, $0.40 / 1M output tokens.
  // Context window: 202,752 tokens.
  Z_AI_GLM_4_7_FLASH: "z-ai/glm-4.7-flash",

  // Qwen3.6 Flash.
  // OpenRouter page: https://openrouter.ai/qwen/qwen3.6-flash
  // Description: fast, efficient Alibaba Qwen 3.6 series model, supports text/image/video input.
  // Pricing: $0.1875 / 1M input tokens, $1.125 / 1M output tokens.
  // Context window: 1,000,000 tokens.
  QWEN_QWEN3_6_FLASH: "qwen/qwen3.6-flash",

  // GPT-5.6 Luna.
  // OpenRouter page: https://openrouter.ai/openai/gpt-5.6-luna
  // Description: fast, cost-efficient OpenAI GPT-5.6 series model for high-volume work
  // (chat, content classification, lightweight agent ops). Pricier than glm-4.7-flash/
  // qwen3.6-flash, but a different provider — used both as the primary model for outreach
  // sequence and target-page generation, and as a last-resort fallback so a shared outage
  // across the flash models doesn't take the whole scoring chain down with them.
  // Pricing: $1.00 / 1M input tokens, $6.00 / 1M output tokens.
  // Context window: 1,000,000 tokens.
  OPENAI_GPT_5_6_LUNA: "openai/gpt-5.6-luna",
} as const

export type OpenRouterModel =
  (typeof OPENROUTER_MODELS)[keyof typeof OPENROUTER_MODELS]

export const DEFAULT_GENERATE_TEXT_MODEL =
  OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO
