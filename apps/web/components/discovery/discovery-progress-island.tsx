"use client"

import { cn } from "@/lib/utils"
import {
  type DiscoveryItem,
  type DiscoveryItemType,
  type DiscoveryStatus,
  type EngineKey,
  useDiscoveryProgress,
} from "@/hooks/use-discovery-progress"
import {
  IconCheck,
  IconChevronRight,
  IconFileText,
  IconLink,
  IconLoader2,
  IconWorld,
  IconX,
} from "@tabler/icons-react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const ENGINE_LABELS: Record<EngineKey, string> = {
  directories: "Directories",
  backlinks: "Backlink opportunities",
  pages: "Product pages",
}

const ITEM_ICONS: Record<DiscoveryItemType, React.ComponentType<{ size?: number; className?: string }>> = {
  backlink: IconLink,
  directory: IconWorld,
  page: IconFileText,
}

function EngineRow({ engineKey, status }: { engineKey: EngineKey; status: DiscoveryStatus }) {
  const s = status[engineKey]
  return (
    <div className="flex items-center gap-2 text-xs">
      {s === "running" || s === "pending" ? (
        <IconLoader2 size={12} className="animate-spin text-muted-foreground" />
      ) : s === "done" ? (
        <IconCheck size={12} className="text-emerald-500" />
      ) : (
        <IconX size={12} className="text-destructive" />
      )}
      <span className={cn("text-muted-foreground", s === "done" && "text-foreground/70")}>
        {ENGINE_LABELS[engineKey]}
      </span>
    </div>
  )
}

function ItemCard({ item }: { item: DiscoveryItem }) {
  const Icon = ITEM_ICONS[item.type]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-center gap-2.5 rounded-md border border-border/60 bg-background/80 px-3 py-2 shadow-sm backdrop-blur-sm"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon size={13} className="text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{item.title}</p>
        {item.subtitle && (
          <p className="truncate text-[10px] text-muted-foreground">{item.subtitle}</p>
        )}
      </div>
    </motion.div>
  )
}

const ENGINE_KEYS: EngineKey[] = ["directories", "backlinks", "pages"]

export function DiscoveryProgressIsland({
  productId,
  userId,
  initialStatus,
  productName,
}: {
  productId: string
  userId: string
  initialStatus: DiscoveryStatus | null
  productName: string
}) {
  const router = useRouter()
  const { status, items, doneCount, isDiscovering } = useDiscoveryProgress(
    productId,
    userId,
    initialStatus
  )
  const [dismissed, setDismissed] = useState(false)
  const allDone = status !== null && doneCount === (status.total ?? 2)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didRefresh = useRef(false)
  // Only show if discovery was still in-flight at mount (at least one engine running/pending).
  // Avoids showing the island on every page refresh after a completed discovery.
  const wasActiveAtMount = useRef(
    initialStatus !== null &&
      ENGINE_KEYS.some((k) => initialStatus[k] === "running" || initialStatus[k] === "pending")
  )

  useEffect(() => {
    if (allDone && !didRefresh.current) {
      didRefresh.current = true
      router.refresh()
    }
  }, [allDone, router])

  useEffect(() => {
    if (allDone && !dismissed) {
      dismissTimer.current = setTimeout(() => setDismissed(true), 8000)
    }
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
  }, [allDone, dismissed])

  const visible = !dismissed && wasActiveAtMount.current && (isDiscovering || allDone) && status !== null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 24, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 w-72 overflow-hidden rounded-xl border border-border bg-background shadow-xl"
        >
          {/* progress bar */}
          <div className="h-1 w-full bg-muted">
            <motion.div
              className="h-1 bg-blaze-orange"
              initial={{ width: 0 }}
              animate={{ width: `${(doneCount / (status.total ?? 2)) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>

          <div className="p-3">
            {/* header */}
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isDiscovering ? (
                  <IconLoader2 size={13} className="animate-spin text-blaze-orange" />
                ) : (
                  <IconCheck size={13} className="text-emerald-500" />
                )}
                <span className="text-xs font-semibold text-foreground">
                  {isDiscovering
                    ? `Analyzing ${productName}… ${doneCount}/${status.total ?? 3}`
                    : `Discovery complete — ${items.length} found`}
                </span>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <IconX size={13} />
              </button>
            </div>

            {/* engine status rows */}
            <div className="mb-3 space-y-1.5">
              {ENGINE_KEYS.map((k) => (
                <EngineRow key={k} engineKey={k} status={status} />
              ))}
            </div>

            {/* live items list */}
            {items.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Latest finds
                </p>
                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                  <AnimatePresence initial={false}>
                    {items.slice(0, 6).map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* CTA when done */}
            {allDone && (
              <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setDismissed(true)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blaze-orange px-3 py-2 text-xs font-semibold text-white hover:bg-blaze-orange/90"
              >
                View all opportunities
                <IconChevronRight size={12} />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
