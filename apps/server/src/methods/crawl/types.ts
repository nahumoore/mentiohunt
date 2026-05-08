export type CrawlResult =
  | { ok: true; sitemapId: string; inserted: number; skipped: number }
  | { ok: false; sitemapId: string; error: string }
  | { ok: false; sitemapId: string; skipped: true; reason: "inactive_profile" };

export type ArticleBasics = {
  title: string;
  description: string | null;
  wordCount: number;
  bodyExcerpt: string;
};
