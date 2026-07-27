import { MDXRemote } from "next-mdx-remote/rsc"
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
          </article>

          <ArticleTableOfContents headings={headings} />
        </div>
      </div>
    </section>
  )
}
