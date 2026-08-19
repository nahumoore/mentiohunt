const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "by-domain-rating", label: "By Domain Rating" },
  { id: "by-relevance", label: "By site fit" },
  { id: "time-to-reply", label: "Time to reply" },
  { id: "classification", label: "Reply outcomes" },
  { id: "sequence-lift", label: "Follow-up lift" },
]

export function Toc() {
  return (
    <nav
      aria-label="Statistics sections"
      className="sticky top-16 z-10 -mx-4 border-y border-border/70 bg-background/85 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-full sm:border sm:px-2"
    >
      <div className="container mx-auto flex max-w-4xl gap-1.5 overflow-x-auto scrollbar-none sm:justify-center">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
