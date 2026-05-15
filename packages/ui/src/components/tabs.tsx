"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

interface TabsCtx {
  activeValue: string | undefined
  orientation: "horizontal" | "vertical"
}

const TabsContext = React.createContext<TabsCtx>({
  activeValue: undefined,
  orientation: "horizontal",
})

function Tabs({
  className,
  orientation = "horizontal",
  onValueChange,
  value,
  defaultValue,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    defaultValue as string | undefined
  )
  const activeValue = value !== undefined ? value : internalValue

  return (
    <TabsContext.Provider value={{ activeValue, orientation }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        className={cn(
          "group/tabs flex gap-2 data-horizontal:flex-col",
          className
        )}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(v) => {
          if (value === undefined) setInternalValue(v)
          onValueChange?.(v)
        }}
        {...props}
      />
    </TabsContext.Provider>
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex max-w-full items-center justify-start text-muted-foreground group-data-horizontal/tabs:h-auto group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "w-full bg-transparent p-0",
        line: "w-full border-b border-border/40 bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface IndicatorRect {
  left: number
  top: number
  width: number
  height: number
}

function TabsList({
  className,
  children,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = React.useState<IndicatorRect | null>(null)
  const { activeValue, orientation } = React.useContext(TabsContext)
  const isFirstEffect = React.useRef(true)

  const updateIndicator = React.useCallback(() => {
    const list = listRef.current
    if (!list) return
    const active = list.querySelector<HTMLElement>(
      '[data-slot="tabs-trigger"][data-state="active"]'
    )
    if (!active) return
    setIndicator({
      left: active.offsetLeft,
      top: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
    })
  }, [])

  // Initial placement before first paint — no flash, no spurious transition
  React.useLayoutEffect(() => {
    updateIndicator()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Subsequent changes after paint so CSS transition plays
  React.useEffect(() => {
    if (isFirstEffect.current) {
      isFirstEffect.current = false
      return
    }
    updateIndicator()
  }, [activeValue, updateIndicator])

  // Reposition on container resize
  React.useEffect(() => {
    const list = listRef.current
    if (!list) return
    const ro = new ResizeObserver(updateIndicator)
    ro.observe(list)
    return () => ro.disconnect()
  }, [updateIndicator])

  const isVertical = orientation === "vertical"

  const indicatorStyle: React.CSSProperties = isVertical
    ? {
        position: "absolute",
        left: -2,
        top: indicator?.top ?? 0,
        width: 2,
        height: indicator?.height ?? 0,
      }
    : {
        position: "absolute",
        left: indicator?.left ?? 0,
        bottom: -1,
        width: indicator?.width ?? 0,
        height: 2,
      }

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        "relative",
        tabsListVariants({ variant }),
        className
      )}
      {...props}
    >
      {indicator && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-0 rounded-full bg-[var(--blaze-orange)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={indicatorStyle}
        />
      )}
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base
        "relative z-[1] inline-flex flex-none items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium transition-colors duration-150",
        // Spacing
        "h-auto px-3 pb-3 pt-0.5",
        // States
        "text-muted-foreground/70 hover:text-muted-foreground",
        "data-[state=active]:text-foreground",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:rounded-sm",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-40",
        // Icons
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        // Tab count badge
        "[&_[data-slot=tab-count]]:ml-1 [&_[data-slot=tab-count]]:text-xs [&_[data-slot=tab-count]]:font-medium [&_[data-slot=tab-count]]:tabular-nums [&_[data-slot=tab-count]]:text-muted-foreground/50",
        "data-[state=active]:[&_[data-slot=tab-count]]:text-muted-foreground",
        // Vertical orientation
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-2",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
