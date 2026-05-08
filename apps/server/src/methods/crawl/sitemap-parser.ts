import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  isArray: (name) => ["url", "sitemap"].includes(name),
});

type ParsedSitemap = {
  urls: string[];
  childSitemaps: string[];
};

function toArray(val: unknown): unknown[] {
  if (val === null || val === undefined) return [];
  return Array.isArray(val) ? val : [val];
}

function extractLoc(entry: unknown): string | null {
  if (!entry || typeof entry !== "object") return null;
  const rec = entry as Record<string, unknown>;
  const loc = rec["loc"];
  if (typeof loc === "string") return loc.trim();
  return null;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function parseSitemap(xml: string): ParsedSitemap {
  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(xml) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`Failed to parse sitemap XML: ${String(err)}`);
  }

  if (parsed["sitemapindex"]) {
    const index = parsed["sitemapindex"] as Record<string, unknown>;
    const childSitemaps = toArray(index["sitemap"])
      .map(extractLoc)
      .filter((loc): loc is string => loc !== null && isValidUrl(loc));
    return { urls: [], childSitemaps };
  }

  if (parsed["urlset"]) {
    const urlset = parsed["urlset"] as Record<string, unknown>;
    const urls = toArray(urlset["url"])
      .map(extractLoc)
      .filter((loc): loc is string => loc !== null && isValidUrl(loc));
    return { urls, childSitemaps: [] };
  }

  return { urls: [], childSitemaps: [] };
}
