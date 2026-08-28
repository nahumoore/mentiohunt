import { IconLink } from "@tabler/icons-react"
import Image from "next/image"

import { cn } from "@/lib/utils"

import { IconBrandMentiohunt } from "./brand-mentiohunt"

function getFaviconUrl(siteUrl: string): string | undefined {
  try {
    const domain = new URL(siteUrl).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return undefined
  }
}

export function QuoteSourceBadge({
  companyUrl,
  className,
}: {
  companyUrl?: string
  className?: string
}) {
  const faviconUrl = companyUrl ? getFaviconUrl(companyUrl) : undefined

  return (
    <div className={cn("flex shrink-0 items-center", className)}>
      <div className="flex aspect-square h-full items-center justify-center rounded-full bg-[var(--color-princeton-orange)]">
        <IconBrandMentiohunt className="h-[56%] w-[56%] text-white" />
      </div>

      {faviconUrl && (
        <>
          <div className="relative z-10 -mx-[15%] flex aspect-square h-[40%] shrink-0 items-center justify-center rounded-full bg-background ring-[3px] ring-background">
            <IconLink className="h-[70%] w-[70%] text-muted-foreground" stroke={2.5} />
          </div>
          <div className="relative flex aspect-square h-full items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border/50">
            <Image
              src={faviconUrl}
              alt=""
              fill
              unoptimized
              className="object-contain p-[18%]"
            />
          </div>
        </>
      )}
    </div>
  )
}
