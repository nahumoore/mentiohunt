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
  "group/tabs-list inline-flex max-w-full items-center justify-start text-muted-foreground group-data-horizontal/tabs:h-auto group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default:
          "w-fit overflow-x-auto rounded-lg border border-border/60 bg-muted/25 p-1",
        line: "w-full rounded-none border-b border-border/60 bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  children,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        "relative gap-1",
        tabsListVariants({ variant }),
        className
      )}
      {...props}
    >
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
        "relative inline-flex flex-none items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent! bg-background/50 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:border-border/70 hover:bg-background hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-border/80 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs data-[state=active]:hover:text-primary has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "h-9 px-3 py-1.5 sm:px-3.5",
        "[&_[data-slot=tab-count]]:ml-0.5 [&_[data-slot=tab-count]]:text-xs [&_[data-slot=tab-count]]:font-medium [&_[data-slot=tab-count]]:text-muted-foreground/80 [&_[data-slot=tab-count]]:tabular-nums data-[state=active]:[&_[data-slot=tab-count]]:text-primary/80",
        "group-data-[variant=line]/tabs-list:h-auto group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:shadow-none group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:pb-3 group-data-[variant=line]/tabs-list:pt-1",
        "after:absolute after:bg-primary after:opacity-0 after:transition-opacity group-data-[variant=line]/tabs-list:after:inset-x-3 group-data-[variant=line]/tabs-list:after:bottom-[-1px] group-data-[variant=line]/tabs-list:after:h-px group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100 group-data-vertical/tabs:after:inset-y-1 group-data-vertical/tabs:after:left-0 group-data-vertical/tabs:after:w-px",
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
