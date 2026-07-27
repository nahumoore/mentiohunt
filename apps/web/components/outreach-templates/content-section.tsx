import { IconBrandX } from "@tabler/icons-react"
import { MDXRemote } from "next-mdx-remote/rsc"
import Image from "next/image"
import remarkGfm from "remark-gfm"

import { ArticleTableOfContents } from "@/components/resources/article-table-of-contents"
import BlogStylings from "@/components/resources/blog-stylings"
import { getArticleHeadings } from "@/lib/mdx-headings"

import type { OutreachTemplateDefinition } from "./data"

function getArticleBody(source: string): string {
  return source.replace(/^#\s+.+(?:\r?\n)+/, "")
}

function MDXContent({ source }: { source: string }) {
  const components = BlogStylings()

  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [],
        },
      }}
    />
  )
}

export function OutreachTemplateContentSection({
  template,
}: {
  template: OutreachTemplateDefinition
}) {
  const articleBody = getArticleBody(template.content)
  const headings = getArticleHeadings(articleBody)

  return (
    <section className="relative bg-background py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,740px)_360px] xl:items-start xl:justify-between xl:gap-16">
          <article className="mx-auto max-w-3xl text-foreground xl:mx-0 xl:max-w-[740px]">
            <MDXContent source={articleBody} />

            <div className="mt-12 flex items-start gap-4 rounded-2xl border border-border bg-muted/30 p-5">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-border">
                <Image
                  src="/founder.webp"
                  alt="Nicolas More"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <a
                  href="https://x.com/nicolasmore_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                >
                  Nicolas More
                </a>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Founder at Mentiohunt. Building distribution tools for
                  founders and small marketing teams. Writes about backlink
                  building and founder-led growth.
                </p>
                <a
                  href="https://x.com/nicolasmore_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <IconBrandX size={12} stroke={2} />
                  @nicolasmore_
                </a>
              </div>
            </div>
          </article>

          <ArticleTableOfContents headings={headings} />
        </div>
      </div>
    </section>
  )
}
