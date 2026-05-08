import { generateText } from "@workspace/openrouter";

type EnrichInput = {
  url: string;
  title: string;
  description: string | null;
  bodyExcerpt: string;
  productDescription: string;
};

type EnrichResult = {
  topics: string[];
  targetKeywords: string[];
};

const SYSTEM = `You are a content analyst. Given an article's metadata and the product it belongs to, extract:
- topics: up to 10 short topic labels covering what the article is about (lowercase, 1-4 words each)
- target_keywords: up to 15 SEO keywords the article targets or could rank for (lowercase)

Reply with valid JSON only, no explanation:
{"topics": [...], "target_keywords": [...]}`;

function normalizeArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return [
    ...new Set(
      val
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.toLowerCase().trim()),
    ),
  ];
}

export async function enrichArticle(input: EnrichInput): Promise<EnrichResult> {
  const lines: string[] = [
    `Product: ${input.productDescription}`,
    `URL: ${input.url}`,
    `Title: ${input.title}`,
  ];
  if (input.description) lines.push(`Description: ${input.description}`);
  if (input.bodyExcerpt) lines.push(`Excerpt: ${input.bodyExcerpt}`);

  try {
    const raw = await generateText({ input: lines.join("\n"), systemInstructions: SYSTEM });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in LLM response");

    const matchStr = jsonMatch[0];
    if (!matchStr) throw new Error("Empty JSON match");

    const parsed = JSON.parse(matchStr) as Record<string, unknown>;

    return {
      topics: normalizeArray(parsed["topics"]).slice(0, 10),
      targetKeywords: normalizeArray(parsed["target_keywords"]).slice(0, 15),
    };
  } catch (err) {
    console.warn(`[enrich] failed for ${input.url}: ${String(err)}`);
    return { topics: [], targetKeywords: [] };
  }
}
