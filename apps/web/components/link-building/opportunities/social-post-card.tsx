import { IconBrandX, IconExternalLink, IconSparkles } from "@tabler/icons-react"
import Link from "next/link"

interface SocialPostCardProps {
  postText: string | null
  postUrl: string | null
  fitReason: string | null
}

function extractXUsername(url: string | null): string | null {
  if (!url) return null
  try {
    const { hostname, pathname } = new URL(url)
    if (hostname === "x.com" || hostname === "twitter.com") {
      const segment = pathname.split("/").filter(Boolean)[0]
      return segment ?? null
    }
  } catch {
    // ignore
  }
  return null
}

function getPlatformFromUrl(url: string | null): "x" | null {
  if (!url) return null
  try {
    const { hostname } = new URL(url)
    if (hostname === "x.com" || hostname === "twitter.com") return "x"
  } catch {
    // ignore
  }
  return null
}

export function SocialPostCard({
  postText,
  postUrl,
  fitReason,
}: SocialPostCardProps) {
  const platform = getPlatformFromUrl(postUrl)
  const username = extractXUsername(postUrl)
  const avatarLetter = username?.[0]?.toUpperCase() ?? "?"

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="px-5 pt-5 pb-5">
          {/* header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* avatar */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                {avatarLetter}
              </div>
              <div className="flex flex-col gap-0.5">
                {username && (
                  <span className="text-sm font-semibold text-foreground">
                    @{username}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {platform === "x" ? "Post on X" : "Social post"}
                </span>
              </div>
            </div>

            {/* platform badge */}
            {platform === "x" && (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground">
                <IconBrandX className="size-[18px] text-background" />
              </div>
            )}
          </div>

          {/* post text */}
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground">
            {postText ?? "Post text unavailable."}
          </p>
        </div>

        {postUrl && (
          <div className="border-t border-border/50 px-5 py-3">
            <Link
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconExternalLink className="size-3.5 shrink-0" />
              View on {platform === "x" ? "X" : "platform"}
            </Link>
          </div>
        )}
      </div>

      {fitReason && (
        <div className="rounded-xl border border-border/60 bg-card px-5 py-4">
          <div className="flex items-start gap-3">
            <IconSparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="flex flex-col gap-1">
              <p className="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                Why this fits
              </p>
              <p className="text-sm leading-6 text-foreground">{fitReason}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
