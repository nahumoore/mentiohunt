import * as cheerio from "cheerio";
import type { ArticleBasics } from "./types.js";

export function extractBasics(html: string): ArticleBasics | null {
  const $ = cheerio.load(html);

  // Title
  const title = (
    $("title").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("h1").first().text().trim()
  ).slice(0, 300);

  if (!title) return null;

  // Description
  const rawDesc =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;
  const description = rawDesc ? rawDesc.slice(0, 1000) : null;

  // Word count + body excerpt from meaningful content
  $("script, style, nav, footer, header").remove();
  const contentEl = $("main, article").first();
  const textSource = contentEl.length ? contentEl : $("body");
  const text = textSource.text().replace(/\s+/g, " ").trim();
  const wordCount = text.split(" ").filter(Boolean).length;
  const bodyExcerpt = text.slice(0, 1500);

  return { title, description, wordCount, bodyExcerpt };
}
