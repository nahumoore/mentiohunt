import { IconArrowUpRight, IconInfoCircle } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

export function SelfServeActionLink({
  href,
  icon: Icon,
  title,
  description,
  primary = false,
}: {
  href: string
  icon: typeof IconInfoCircle
  title: string
  description: string
  primary?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start gap-3 rounded-2xl p-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        primary
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "border border-border/70 bg-background hover:border-orange/25 hover:bg-orange/5"
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          primary ? "bg-background/15" : "bg-orange/10 text-orange-700"
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p
          className={cn(
            "mt-1 text-xs leading-5",
            primary ? "text-background/70" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      </div>
      <IconArrowUpRight
        className={cn(
          "mt-1 size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
          primary ? "text-background/70" : "text-muted-foreground"
        )}
      />
    </a>
  )
}
