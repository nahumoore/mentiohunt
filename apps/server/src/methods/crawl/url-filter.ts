const ALLOW_SEGMENTS = new Set([
  "blog", "blogs", "resources", "resource", "guides", "guide",
  "articles", "article", "learn", "learning", "academy",
  "tutorials", "tutorial", "case-studies", "case-study",
  "customers", "stories", "free-tools", "tools", "library",
  "insights", "posts", "news",
]);

const DENY_SEGMENTS = new Set([
  "privacy", "terms", "tos", "cookie", "cookies", "legal",
  "gdpr", "dmca", "eula", "imprint", "disclaimer",
  "login", "signin", "signup", "register", "auth",
  "account", "dashboard", "pricing", "plans", "checkout", "cart",
  "contact", "about", "team", "careers", "jobs",
  "press", "media-kit", "sitemap", "rss", "feed",
  "404", "500", "thank-you", "thanks", "unsubscribe",
  "search", "tag", "tags", "category", "categories",
  "author", "authors",
]);

const DENY_EXTENSIONS = /\.(pdf|jpe?g|png|gif|webp|svg|zip|xml|json)$/i;

export function shouldKeepUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  const path = parsed.pathname.toLowerCase();

  if (DENY_EXTENSIONS.test(path)) return false;

  const segments = path.split("/").filter(Boolean);

  if (segments.some((s) => DENY_SEGMENTS.has(s))) return false;

  const first = segments[0];
  if (first !== undefined && ALLOW_SEGMENTS.has(first)) return true;

  return false;
}
