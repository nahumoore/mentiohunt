export const OPENROUTER_MODELS = {
  // Gemini 2.5 Flash.
  // OpenRouter page: https://openrouter.ai/google/gemini-2.5-flash
  // Description: well-rounded multimodal model with strong reasoning capabilities.
  // Pricing: $0.30 / 1M input tokens, $2.50 / 1M output tokens.
  // Context window: 1,048,576 tokens.
  GOOGLE_GEMINI_2_5_FLASH: "google/gemini-2.5-flash",

  // Anthropic Claude Haiku 4.5.
  // OpenRouter page: https://openrouter.ai/anthropic/claude-haiku-4.5
  // Description: fastest and most efficient Claude model, near-frontier intelligence at low cost and latency.
  // Pricing: $1.00 / 1M input tokens, $5.00 / 1M output tokens.
  // Context window: 200,000 tokens.
  ANTHROPIC_CLAUDE_HAIKU_4_5: "anthropic/claude-haiku-4.5",

  // DeepSeek V4 Pro.
  // OpenRouter page: https://openrouter.ai/deepseek/deepseek-v4-pro
  // Description: DeepSeek reasoning model for capable production chat and extraction use cases.
  // Pricing: see OpenRouter model page.
  // Context window: see OpenRouter model page.
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
} as const

export type OpenRouterModel =
  (typeof OPENROUTER_MODELS)[keyof typeof OPENROUTER_MODELS]

export const DEFAULT_GENERATE_TEXT_MODEL =
  OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO
