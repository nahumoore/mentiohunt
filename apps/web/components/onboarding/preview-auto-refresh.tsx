"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function PreviewAutoRefresh({
  previewId,
  status,
  resultCount,
}: {
  previewId: string
  status: string
  resultCount: number
}) {
  const router = useRouter()

  useEffect(() => {
    if (status === "ready" || status === "partial") return
    if (status !== "pending" && status !== "processing") return
    const timer = window.setInterval(() => router.refresh(), 3000)
    return () => window.clearInterval(timer)
  }, [previewId, resultCount, router, status])

  return null
}
