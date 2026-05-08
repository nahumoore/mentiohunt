import fs from "fs"
import matter from "gray-matter"
import path from "path"

export type BlogPost = {
  meta: BlogPostMeta
  content: string
}

export type BlogPostMeta = {
  title: string
  description: string
  date: string
  tags: string[]
  slug: string
  author?: string
  excerpt?: string
  image?: string
  imageAlt?: string
  id?: string
  readTime?: string
  category?: string
  featured?: boolean
}

export type ContentType = "blog" | "free-tools" | "guides" | "alternatives"

function getContentDirectory(contentType: ContentType = "blog"): string {
  return path.join(process.cwd(), "resources", contentType)
}

function getDefaultCategory(contentType: ContentType): string {
  if (contentType === "alternatives") return "Alternative"
  if (contentType === "guides") return "Guide"
  if (contentType === "free-tools") return "Free Tool"
  return "Blog"
}

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  return `${readTimeMinutes} min read`
}

function toStringValue(value: unknown, fallback = ""): string {
  if (value instanceof Date) return value.toISOString()
  return typeof value === "string" ? value : fallback
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

export function getResourceSlugs(contentType: ContentType = "blog"): string[] {
  const contentDirectory = getContentDirectory(contentType)

  if (!fs.existsSync(contentDirectory)) {
    return []
  }

  const files = fs.readdirSync(contentDirectory)
  return files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""))
}

export function getPostBySlug(
  slug: string,
  contentType: ContentType = "blog"
): BlogPost | null {
  const contentDirectory = getContentDirectory(contentType)
  const filePath = path.join(contentDirectory, `${slug}.mdx`)

  try {
    const fileContent = fs.readFileSync(filePath, "utf8")
    const { data, content } = matter(fileContent)

    if (!data.title || !data.date) {
      console.warn(`Missing required frontmatter in ${slug}.mdx`)
    }

    return {
      meta: {
        slug,
        title: toStringValue(data.title, "Untitled"),
        description: toStringValue(data.description, toStringValue(data.excerpt)),
        date: toStringValue(data.date, new Date().toISOString()),
        author: toStringValue(data.author, "Unknown"),
        tags: toStringArray(data.tags),
        image: toStringValue(data.image) || undefined,
        imageAlt: toStringValue(data.imageAlt) || undefined,
        excerpt: toStringValue(data.excerpt, toStringValue(data.description)),
        category: toStringValue(data.category, getDefaultCategory(contentType)),
        featured: typeof data.featured === "boolean" ? data.featured : undefined,
        id: toStringValue(data.id) || undefined,
        readTime: toStringValue(data.readTime, calculateReadTime(content)),
      },
      content,
    }
  } catch (error) {
    console.error(`Error processing ${slug}.mdx:`, error)
    return null
  }
}

export function getAllResources(
  contentType: ContentType = "blog"
): BlogPostMeta[] {
  const slugs = getResourceSlugs(contentType)
  const resources = slugs.map((slug) => {
    const post = getPostBySlug(slug, contentType)
    return post?.meta
  })

  return resources
    .filter((post): post is BlogPostMeta => !!post)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getRelatedResources(
  inputSlug: string,
  contentType: ContentType = "blog"
): BlogPostMeta[] {
  const currentPost = getPostBySlug(inputSlug, contentType)
  const currentTags = currentPost?.meta.tags ?? []

  const slugs = getResourceSlugs(contentType)

  return slugs
    .filter((slug) => slug !== inputSlug)
    .map((slug) => getPostBySlug(slug, contentType)?.meta)
    .filter((post): post is BlogPostMeta => !!post)
    .map((post) => ({
      post,
      matchCount:
        post.tags?.filter((tag) => currentTags.includes(tag)).length ?? 0,
    }))
    .filter(({ matchCount }) => matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 3)
    .map(({ post }) => post)
}
