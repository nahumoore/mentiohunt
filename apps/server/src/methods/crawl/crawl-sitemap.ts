import pLimit from "p-limit";
import { supabaseAdmin } from "@workspace/supabase/admin";
import { fetchWithRetry } from "./http.js";
import { parseSitemap } from "./sitemap-parser.js";
import { shouldKeepUrl } from "./url-filter.js";
import { extractBasics } from "./extract-html.js";
import { enrichArticle } from "./enrich.js";
import type { CrawlResult } from "./types.js";

const ARTICLE_CAP = 100;
const CONCURRENCY = 5;
const MAX_SITEMAP_DEPTH = 3;
const MAX_CHILD_SITEMAPS = 50;

type SitemapRow = {
  id: string;
  product_id: string;
  url: string;
  products: {
    product_description: string;
    profiles: {
      active_trial: boolean;
    };
  };
};

type ArticleInsert = {
  product_id: string;
  sitemap_id: string;
  url: string;
  title: string;
  description: string | null;
  word_count: number | null;
  topics: string[];
  target_keywords: string[];
  source: "sitemap";
  status: "active";
};

async function collectUrls(
  sitemapUrl: string,
  depth: number,
  seen: Set<string>,
): Promise<string[]> {
  if (depth > MAX_SITEMAP_DEPTH) return [];

  let xml: string;
  try {
    const res = await fetchWithRetry(sitemapUrl, { accept: "application/xml" });
    xml = res.body;
  } catch (err) {
    console.warn(`[crawl] failed to fetch sitemap ${sitemapUrl}: ${String(err)}`);
    return [];
  }

  const { urls, childSitemaps } = parseSitemap(xml);
  const allUrls: string[] = [...urls];

  for (const child of childSitemaps.slice(0, MAX_CHILD_SITEMAPS)) {
    if (seen.has(child)) continue;
    seen.add(child);
    const nested = await collectUrls(child, depth + 1, seen);
    allUrls.push(...nested);
  }

  return allUrls;
}

export async function crawlSitemap(sitemapId: string): Promise<CrawlResult> {
  const { data, error: fetchErr } = await supabaseAdmin
    .from("product_sitemaps")
    .select("id, product_id, url, products!inner(product_description, profiles!inner(active_trial))")
    .eq("id", sitemapId)
    .single();

  if (fetchErr || !data) {
    return { ok: false, sitemapId, error: fetchErr?.message ?? "Sitemap not found" };
  }

  // Supabase nested join types collapse to `any` without explicit DB relation hints.
  // Cast to our expected shape — mirrors the select above exactly.
  const sitemap = data as unknown as SitemapRow;

  if (!sitemap.products.profiles.active_trial) {
    return { ok: false, sitemapId, skipped: true, reason: "inactive_profile" } as CrawlResult;
  }

  let allUrls: string[];
  try {
    allUrls = await collectUrls(sitemap.url, 1, new Set([sitemap.url]));
  } catch (err) {
    await supabaseAdmin
      .from("product_sitemaps")
      .update({ status: "error" })
      .eq("id", sitemapId);
    return { ok: false, sitemapId, error: String(err) };
  }

  const filtered = allUrls.filter(shouldKeepUrl);

  const { data: existing } = await supabaseAdmin
    .from("product_articles")
    .select("url")
    .eq("product_id", sitemap.product_id);

  const existingUrls = new Set((existing ?? []).map((r) => r.url));
  const newUrls = filtered.filter((u) => !existingUrls.has(u));

  const toProcess = newUrls.slice(0, ARTICLE_CAP);
  const skippedCount = newUrls.length - toProcess.length;

  if (toProcess.length === 0) {
    await supabaseAdmin
      .from("product_sitemaps")
      .update({ last_crawled_at: new Date().toISOString() })
      .eq("id", sitemapId);
    return { ok: true, sitemapId, inserted: 0, skipped: skippedCount };
  }

  const limit = pLimit(CONCURRENCY);
  const { product_description } = sitemap.products;
  const rows: ArticleInsert[] = [];

  await Promise.all(
    toProcess.map((url) =>
      limit(async () => {
        try {
          const res = await fetchWithRetry(url);
          const basics = extractBasics(res.body);
          if (!basics) {
            console.warn(`[crawl] no title extracted for ${url}, skipping`);
            return;
          }
          const enriched = await enrichArticle({
            url,
            title: basics.title,
            description: basics.description,
            bodyExcerpt: basics.bodyExcerpt,
            productDescription: product_description,
          });
          rows.push({
            product_id: sitemap.product_id,
            sitemap_id: sitemapId,
            url,
            title: basics.title,
            description: basics.description,
            word_count: basics.wordCount,
            topics: enriched.topics,
            target_keywords: enriched.targetKeywords,
            source: "sitemap",
            status: "active",
          });
        } catch (err) {
          console.warn(`[crawl] error processing ${url}: ${String(err)}`);
        }
      }),
    ),
  );

  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error: insertErr } = await supabaseAdmin
      .from("product_articles")
      .insert(rows.slice(i, i + BATCH));
    if (insertErr) {
      console.error(`[crawl] insert batch failed: ${insertErr.message}`);
    }
  }

  const { data: current } = await supabaseAdmin
    .from("product_sitemaps")
    .select("articles_discovered")
    .eq("id", sitemapId)
    .single();

  await supabaseAdmin
    .from("product_sitemaps")
    .update({
      last_crawled_at: new Date().toISOString(),
      articles_discovered: (current?.articles_discovered ?? 0) + rows.length,
      status: "active",
    })
    .eq("id", sitemapId);

  return { ok: true, sitemapId, inserted: rows.length, skipped: skippedCount };
}

export async function crawlAllActiveSitemaps(): Promise<CrawlResult[]> {
  // Robots.txt: not enforced in v1. User-Agent set so sites can block deliberately.
  // TODO: enforce robots.txt before scaling.

  const { data: sitemaps, error } = await supabaseAdmin
    .from("product_sitemaps")
    .select("id, products!inner(profiles!inner(active_trial))")
    .eq("status", "active")
    .eq("products.profiles.active_trial", true);

  if (error || !sitemaps) {
    console.error("[crawl] failed to load active sitemaps:", error?.message);
    return [];
  }

  const results: CrawlResult[] = [];
  for (const sitemap of sitemaps) {
    results.push(await crawlSitemap(sitemap.id));
  }

  return results;
}
