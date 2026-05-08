"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex max-w-full items-center justify-start text-muted-foreground group-data-horizontal/tabs:h-auto group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:rounded-2xl",
  {
    variants: {
      variant: {
        default:
          "w-fit overflow-x-auto rounded-full border border-border/70 bg-muted/50 p-1.5 shadow-inner shadow-foreground/5",
        line: "w-full gap-1 rounded-none border-b border-border/60 bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
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
        "relative inline-flex flex-none items-center justify-center gap-2 whitespace-nowrap border border-transparent! text-sm font-medium text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "h-10 rounded-full px-3.5 py-2 data-[state=active]:bg-[linear-gradient(135deg,var(--color-crimson-carrot),var(--color-orange))] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-orange/20 data-[state=active]:hover:text-white sm:px-4",
        "[&_[data-slot=tab-count]]:ml-1 [&_[data-slot=tab-count]]:rounded-full [&_[data-slot=tab-count]]:bg-background [&_[data-slot=tab-count]]:px-2 [&_[data-slot=tab-count]]:py-0.5 [&_[data-slot=tab-count]]:text-[11px] [&_[data-slot=tab-count]]:leading-none [&_[data-slot=tab-count]]:font-bold [&_[data-slot=tab-count]]:text-muted-foreground [&_[data-slot=tab-count]]:tabular-nums [&_[data-slot=tab-count]]:ring-1 [&_[data-slot=tab-count]]:ring-border/60 data-[state=active]:[&_[data-slot=tab-count]]:bg-white/20 data-[state=active]:[&_[data-slot=tab-count]]:text-white data-[state=active]:[&_[data-slot=tab-count]]:ring-white/20",
        "group-data-[variant=line]/tabs-list:h-auto group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-4 group-data-[variant=line]/tabs-list:pb-3 group-data-[variant=line]/tabs-list:pt-1 group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:text-foreground group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[variant=line]/tabs-list:after:inset-x-0 group-data-[variant=line]/tabs-list:after:bottom-[-5px] group-data-[variant=line]/tabs-list:after:h-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5",
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
