/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"
import type { MDXComponents } from "mdx/types"
import Link from "next/link"
import type { ReactElement } from "react"
import {
  PricingNote,
  QuickVerdict,
  ToolStrengths,
  WhenToChoose,
} from "./comparison-components"
import { CodeBlock } from "./code-block"
import { YoutubeVideo } from "./youtube-video"

export default function BlogStylings(): MDXComponents {
  return {
    h1: (props) => {
      const id = props.children
        ?.toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")

      return (
        <h1
          {...props}
          id={id}
          className={cn(
            "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl",
            props.className
          )}
        />
      )
    },
    h2: (props) => {
      const id = props.children
        ?.toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")

      return (
        <h2
          {...props}
          id={id}
          className={cn(
            "mt-16 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0",
            props.className
          )}
        />
      )
    },
    h3: (props) => {
      const id = props.children
        ?.toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")

      return (
        <h3
          {...props}
          id={id}
          className={cn(
            "mt-10 scroll-m-20 text-2xl font-semibold tracking-tight",
            props.className
          )}
        />
      )
    },
    h4: (props) => {
      const id = props.children
        ?.toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")

      return (
        <h4
          {...props}
          id={id}
          className={cn(
            "mt-8 scroll-m-20 text-xl font-semibold tracking-tight",
            props.className
          )}
        />
      )
    },
    p: (props) => (
      <p
        {...props}
        className={cn(
          "text-base leading-7 [&:not(:first-child)]:mt-6",
          props.className
        )}
      />
    ),
    ul: (props) => (
      <ul
        {...props}
        className={cn(
          "my-6 ml-6 list-disc space-y-3 [&>li]:leading-7",
          props.className
        )}
      />
    ),
    ol: (props) => (
      <ol
        {...props}
        className={cn(
          "my-6 ml-6 list-decimal space-y-3 [&>li]:leading-7",
          props.className
        )}
      />
    ),
    pre: ({ children }) => {
      const codeEl = children as ReactElement<{
        className?: string
        children?: string | string[]
      }>
      const code = Array.isArray(codeEl?.props?.children)
        ? codeEl.props.children.join("")
        : (codeEl?.props?.children ?? "")
      const className = codeEl?.props?.className ?? ""
      const language = className.replace("language-", "") || undefined
      return <CodeBlock code={code} language={language} />
    },
    code: (props) => (
      <code
        className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium"
        {...props}
      />
    ),
    a: ({ href, rel, target, className, ...props }) => {
      const hrefValue = href || ""
      const isExternal = /^https?:\/\//.test(hrefValue)
      const relParts = new Set(rel?.split(/\s+/).filter(Boolean))

      if (isExternal) {
        relParts.add("noopener")
        relParts.add("noreferrer")
      }

      return (
        <Link
          {...props}
          href={hrefValue}
          className={cn(
            "font-medium text-primary underline decoration-foreground/10 underline-offset-4 transition-colors hover:decoration-foreground/25",
            className
          )}
          target={target ?? (isExternal ? "_blank" : undefined)}
          rel={relParts.size > 0 ? Array.from(relParts).join(" ") : undefined}
        >
          {props.children}
        </Link>
      )
    },
    table: (props) => (
      <div className="my-6 w-full overflow-x-auto rounded-lg border border-border">
        <table
          {...props}
          className={cn("w-full border-collapse text-sm", props.className)}
        />
      </div>
    ),
    thead: (props) => (
      <thead
        {...props}
        className={cn("border-b border-border bg-muted/50", props.className)}
      />
    ),
    tbody: (props) => <tbody {...props} className={cn("", props.className)} />,
    tr: (props) => (
      <tr
        {...props}
        className={cn(
          "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
          props.className
        )}
      />
    ),
    th: (props) => (
      <th
        {...props}
        className={cn(
          "h-10 px-4 text-left align-middle font-medium [&[align=center]]:text-center [&[align=right]]:text-right",
          props.className
        )}
      />
    ),
    td: (props) => (
      <td
        {...props}
        className={cn(
          "p-4 align-middle [&[align=center]]:text-center [&[align=right]]:text-right",
          props.className
        )}
      />
    ),
    blockquote: (props) => (
      <blockquote
        {...props}
        className={cn(
          "mt-6 border-l-2 border-primary pl-6 text-muted-foreground italic",
          props.className
        )}
      />
    ),
    img: (props) => (
      <img
        {...props}
        className={cn("rounded-lg border border-border", props.className)}
      />
    ),
    hr: (props) => (
      <hr
        {...props}
        className={cn("my-4 border-border md:my-8", props.className)}
      />
    ),
    YoutubeVideo,
    QuickVerdict,
    ToolStrengths,
    WhenToChoose,
    PricingNote,
  }
}
