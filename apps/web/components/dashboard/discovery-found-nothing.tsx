import { IconSearch } from "@tabler/icons-react"

/**
 * Shown when discovery has finished and genuinely found zero opportunities —
 * distinct from AllReviewedEmpty's "you've worked through everything" copy,
 * which is wrong for an account that never had a single opportunity to begin
 * with. Discovery keeps running daily, so this isn't a dead end.
 */
export function DiscoveryFoundNothing() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
        <IconSearch className="size-5 text-(--color-blaze-orange)" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-foreground">
          No opportunities found yet
        </p>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">
          Our first search based on your site and competitors didn&apos;t turn
          up a match — that happens for newer or more niche products.
          Discovery keeps running automatically, and we&apos;ll email you as
          soon as something turns up.
        </p>
      </div>
    </div>
  )
}
