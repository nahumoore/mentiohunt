"use client"

import { useState } from "react"
import {
  IconBrandLinkedin,
  IconBrandX,
  IconCheck,
  IconClipboardText,
  IconCode,
  IconDots,
  IconDownload,
  IconFileVector,
  IconLink,
  IconPhoto,
} from "@tabler/icons-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { SITE_URL } from "../links"
import {
  copyChartPng,
  downloadChartPng,
  downloadChartSvg,
  type ChartExportMeta,
} from "./export-chart"

export type ShareTone = "ghost" | "panel" | "prominent"

const TONE_CLASSES: Record<ShareTone, { row: string; button: string; primary: string }> = {
  ghost: {
    row: "gap-1",
    button:
      "rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
    primary:
      "rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
  },
  panel: {
    row: "gap-1.5",
    button:
      "rounded-lg border border-border bg-background px-2 py-1.5 text-muted-foreground hover:border-(--color-blaze-orange)/35 hover:text-(--color-princeton-orange)",
    primary:
      "rounded-lg border border-border bg-background px-2 py-1.5 text-muted-foreground hover:border-(--color-blaze-orange)/35 hover:text-(--color-princeton-orange)",
  },
  prominent: {
    row: "gap-2",
    button:
      "rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:border-(--color-blaze-orange)/35 hover:text-(--color-princeton-orange)",
    primary:
      "rounded-full border border-transparent bg-foreground px-3.5 py-2 text-sm font-semibold text-background shadow-sm hover:bg-foreground/90",
  },
}

export interface ChartShareProps {
  /** Anchor id of the chart section — used for the deep link. */
  anchorId: string
  /** The citable one-sentence claim this chart supports. */
  stat: string
  /** Canonical URL of the edition this chart belongs to. */
  pageUrl: string
  /** Embeddable route for this chart. */
  embedPath: string
  meta: ChartExportMeta
  /** Resolves the live <svg> node at click time. */
  getSvg: () => SVGSVGElement | null
}

function embedSnippet(embedPath: string, pageUrl: string, meta: ChartExportMeta) {
  return [
    `<iframe src="${SITE_URL}${embedPath}" width="100%" height="520" loading="lazy" style="border:0;overflow:hidden"`,
    `  title="${meta.title} — Mentiohunt link building statistics"></iframe>`,
    `<p>Source: <a href="${pageUrl}">Link building statistics</a> by Mentiohunt</p>`,
  ].join("\n")
}

export function ShareBar({
  anchorId,
  stat,
  pageUrl,
  embedPath,
  meta,
  getSvg,
  tone = "panel",
  showLabels = false,
}: ChartShareProps & { tone?: ShareTone; showLabels?: boolean }) {
  const [justCopied, setJustCopied] = useState<string | null>(null)
  const classes = TONE_CLASSES[tone]

  const deepLink = `${pageUrl}#${anchorId}`
  const citation = `${stat} — Mentiohunt, ${meta.sourceLine} (${deepLink})`

  function flash(key: string) {
    setJustCopied(key)
    window.setTimeout(
      () => setJustCopied((current) => (current === key ? null : current)),
      1800
    )
  }

  async function copyText(key: string, text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text)
      flash(key)
      toast.success(message)
    } catch {
      toast.error("Your browser blocked clipboard access")
    }
  }

  async function withSvg(action: (svg: SVGSVGElement) => Promise<void>) {
    const svg = getSvg()
    if (!svg) {
      toast.error("Chart is not ready yet — try again in a moment")
      return
    }
    try {
      await action(svg)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not export this chart"
      )
    }
  }

  const iconSize = tone === "prominent" ? 16 : 15

  return (
    <div className={`flex shrink-0 items-center ${classes.row}`}>
      <button
        type="button"
        onClick={() => copyText("stat", citation, "Stat + citation copied")}
        className={`inline-flex items-center gap-1.5 transition-colors ${classes.primary}`}
        title="Copy the stat with its citation and link"
      >
        {justCopied === "stat" ? (
          <IconCheck size={iconSize} stroke={2.6} className="text-emerald-600" />
        ) : (
          <IconClipboardText size={iconSize} stroke={2.1} />
        )}
        {showLabels ? <span>Copy stat</span> : null}
      </button>

      <button
        type="button"
        onClick={() =>
          withSvg(async (svg) => {
            await copyChartPng(svg, meta)
            flash("image")
            toast.success("Chart image copied — paste it anywhere")
          })
        }
        className={`inline-flex items-center gap-1.5 transition-colors ${classes.button}`}
        title="Copy the chart as an image"
      >
        {justCopied === "image" ? (
          <IconCheck size={iconSize} stroke={2.6} className="text-emerald-600" />
        ) : (
          <IconPhoto size={iconSize} stroke={2.1} />
        )}
        {showLabels ? <span>Copy image</span> : null}
      </button>

      <button
        type="button"
        onClick={() =>
          withSvg(async (svg) => {
            await downloadChartPng(svg, meta)
            toast.success("PNG downloaded")
          })
        }
        className={`inline-flex items-center gap-1.5 transition-colors ${classes.button}`}
        title="Download the chart as a PNG"
      >
        <IconDownload size={iconSize} stroke={2.1} />
        {showLabels ? <span>PNG</span> : null}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={`inline-flex items-center gap-1.5 transition-colors ${classes.button}`}
          title="More sharing options"
          aria-label="More sharing options"
        >
          <IconDots size={iconSize} stroke={2.1} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
            Cite or embed
          </DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() =>
              copyText(
                "embed",
                embedSnippet(embedPath, pageUrl, meta),
                "Embed code copied — it links back automatically"
              )
            }
          >
            <IconCode size={15} stroke={2.1} />
            Copy embed code
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => copyText("link", deepLink, "Link to this chart copied")}
          >
            <IconLink size={15} stroke={2.1} />
            Copy link to this chart
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              withSvg(async (svg) => {
                await downloadChartSvg(svg, meta)
                toast.success("SVG downloaded")
              })
            }
          >
            <IconFileVector size={15} stroke={2.1} />
            Download SVG (print quality)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
            Post it
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(stat)}&url=${encodeURIComponent(deepLink)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandX size={15} stroke={2.1} />
              Share on X
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(deepLink)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandLinkedin size={15} stroke={2.1} />
              Share on LinkedIn
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
