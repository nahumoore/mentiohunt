"use client"

import { IconListDetails } from "@tabler/icons-react"
import { useEffect, useState } from "react"

import type { ArticleHeading } from "@/lib/mdx-headings"
import { cn } from "@/lib/utils"

type ArticleTableOfContentsProps = {
  headings: ArticleHeading[]
}

export function ArticleTableOfContents({
  headings,
}: ArticleTableOfContentsProps) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (entryA, entryB) =>
              entryA.boundingClientRect.top - entryB.boundingClientRect.top
          )[0]

        if (visibleEntry?.target.id) {
          setActiveId(visibleEntry.target.id)
        }
      },
      {
        rootMargin: "-22% 0px -68% 0px",
        threshold: [0, 1],
      }
    )

    headings.forEach((heading) => {
      const headingElement = document.getElementById(heading.id)

      if (headingElement) {
        observer.observe(headingElement)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  function handleClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    headingId: string
  ) {
    event.preventDefault()

    const headingElement = document.getElementById(headingId)

    if (!headingElement) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    headingElement.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    })
    window.history.pushState(null, "", `#${headingId}`)
    setActiveId(headingId)
  }

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-border/80 bg-card/80 shadow-[0_24px_90px_-42px_rgba(255,133,0,0.45)] backdrop-blur">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,var(--color-amber-glow)_0%,transparent_62%)] opacity-15" />
        <div className="relative border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-2 text-[0.68rem] font-bold tracking-[0.2em] text-[var(--color-princeton-orange)] uppercase">
            <IconListDetails size={14} stroke={2.4} />
            Contents
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Jump to the comparison details that matter most.
          </p>
        </div>
        <nav aria-label="Article contents" className="relative p-2">
          {headings.map((heading) => {
            const isActive = activeId === heading.id
            const isSubItem = heading.depth === 3

            return (
              <a
                key={`${heading.id}-${heading.depth}-${heading.text}`}
                href={`#${heading.id}`}
                onClick={(event) => handleClick(event, heading.id)}
                className={cn(
                  "group relative flex rounded-xl py-2.5 pr-3 leading-5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  isSubItem
                    ? "ml-5 pl-6 text-[0.8125rem]"
                    : "pl-4 text-sm font-medium",
                  isActive
                    ? "bg-[var(--color-princeton-orange)]/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "absolute top-3 bottom-3 rounded-full transition-colors",
                    isSubItem ? "left-3 w-px" : "left-2 w-px",
                    isActive
                      ? "bg-[var(--color-princeton-orange)]"
                      : "bg-border group-hover:bg-[var(--color-princeton-orange)]/45"
                  )}
                />
                {isSubItem && (
                  <span
                    className={cn(
                      "absolute top-1/2 left-3 h-px w-3 -translate-y-1/2 transition-colors",
                      isActive
                        ? "bg-[var(--color-princeton-orange)]"
                        : "bg-border group-hover:bg-[var(--color-princeton-orange)]/45"
                    )}
                  />
                )}
                {heading.text}
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
