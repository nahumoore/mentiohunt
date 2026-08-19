"use client"

import { createContext, useContext, type ReactNode } from "react"

import type { Edition } from "@/content/link-building-statistics/types"

const EditionContext = createContext<Edition | null>(null)

/**
 * Threads one year's edition down to every client chart/share component, so
 * the report and embed routes can both render any year without the
 * components hard-importing a specific year's data file.
 */
export function EditionProvider({
  edition,
  children,
}: {
  edition: Edition
  children: ReactNode
}) {
  return (
    <EditionContext.Provider value={edition}>
      {children}
    </EditionContext.Provider>
  )
}

export function useEdition(): Edition {
  const edition = useContext(EditionContext)
  if (!edition) {
    throw new Error("useEdition() must be used within an EditionProvider")
  }
  return edition
}
