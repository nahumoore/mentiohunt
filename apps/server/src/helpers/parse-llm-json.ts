// Extract JSON from LLM output that may be wrapped in markdown fences or prefixed with text.
export function parseLlmJson<T>(text: string): T {
  // 1. Direct parse
  try {
    return JSON.parse(text) as T
  } catch {}

  // 2. Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1]) as T
    } catch {}
  }

  // 3. Extract first { ... } block
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start !== -1 && end > start) {
    return JSON.parse(text.slice(start, end + 1)) as T
  }

  throw new SyntaxError("No valid JSON found in LLM response")
}
