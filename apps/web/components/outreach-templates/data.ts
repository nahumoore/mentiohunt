import fs from "fs"
import matter from "gray-matter"
import path from "path"

export interface OutreachTemplateDefinition {
  slug: string
  title: string
  description: string
  image?: string
  imageAlt?: string
  date?: string
  dateModified?: string
  readTime: string
  faqs: { question: string; answer: string }[]
  content: string
}

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  return `${readTimeMinutes} min read`
}

function getContentDirectory(): string {
  return path.join(process.cwd(), "resources", "outreach-templates")
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function toFaqs(value: unknown): { question: string; answer: string }[] {
  return Array.isArray(value)
    ? (value as Array<{ question: string; answer: string }>)
    : []
}

export function getOutreachTemplateSlugs(): string[] {
  const contentDirectory = getContentDirectory()

  if (!fs.existsSync(contentDirectory)) {
    return []
  }

  return fs
    .readdirSync(contentDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""))
}

export function getOutreachTemplate(
  slug: string
): OutreachTemplateDefinition | undefined {
  const filePath = path.join(getContentDirectory(), `${slug}.mdx`)

  try {
    const fileContent = fs.readFileSync(filePath, "utf8")
    const { data, content } = matter(fileContent)

    return {
      slug,
      title: toStringValue(data.title),
      description: toStringValue(data.description),
      image: toStringValue(data.image) || undefined,
      imageAlt: toStringValue(data.imageAlt) || undefined,
      date: toStringValue(data.date) || undefined,
      dateModified: toStringValue(data.dateModified) || undefined,
      readTime: toStringValue(data.readTime) || calculateReadTime(content),
      faqs: toFaqs(data.faqs),
      content,
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined
    }

    console.error(`Error processing ${slug}.mdx:`, error)
    return undefined
  }
}

export function getAllOutreachTemplates(): OutreachTemplateDefinition[] {
  return getOutreachTemplateSlugs()
    .map((slug) => getOutreachTemplate(slug))
    .filter((template): template is OutreachTemplateDefinition => !!template)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
}

export function getRelatedOutreachTemplates(
  slug: string,
  limit = 3
): OutreachTemplateDefinition[] {
  return getAllOutreachTemplates()
    .filter((template) => template.slug !== slug)
    .slice(0, limit)
}
