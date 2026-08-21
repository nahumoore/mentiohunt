"use client"

import { KeywordsSection } from "@/components/link-building/sources/keywords-section"
import { useProductStore } from "@/stores/product-store"

export function KeywordsTab() {
  const product = useProductStore((s) => s.product)
  const setProduct = useProductStore((s) => s.setProduct)
  const targetKeywords = product?.target_keywords ?? []

  async function addKeyword(keyword: string) {
    try {
      const response = await fetch("/api/link-building/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        keywords?: string[]
      } | null

      if (!response.ok || !payload?.keywords) {
        return payload?.error ?? "Could not add keyword."
      }

      if (product) setProduct({ ...product, target_keywords: payload.keywords })
      return null
    } catch (error) {
      return error instanceof Error ? error.message : "Could not add keyword."
    }
  }

  async function removeKeyword(keyword: string) {
    try {
      const response = await fetch("/api/link-building/keywords", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        keywords?: string[]
      } | null

      if (!response.ok || !payload?.keywords) {
        return payload?.error ?? "Could not remove keyword."
      }

      if (product) setProduct({ ...product, target_keywords: payload.keywords })
      return null
    } catch (error) {
      return error instanceof Error ? error.message : "Could not remove keyword."
    }
  }

  // KeywordPriorityList tracks the dragged order locally and only calls this
  // once the drag settles, so the store is untouched (and rollback-free)
  // until the reorder is actually confirmed by the server.
  async function reorderKeywords(keywords: string[]) {
    try {
      const response = await fetch("/api/link-building/keywords", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        keywords?: string[]
      } | null

      if (!response.ok || !payload?.keywords) {
        return payload?.error ?? "Could not save keyword order."
      }

      if (product) setProduct({ ...product, target_keywords: payload.keywords })
      return null
    } catch (error) {
      return error instanceof Error ? error.message : "Could not save keyword order."
    }
  }

  return (
    <KeywordsSection
      keywords={targetKeywords}
      onAdd={addKeyword}
      onRemove={removeKeyword}
      onReorderCommit={reorderKeywords}
    />
  )
}
