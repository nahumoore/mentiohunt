import type { Metadata } from "next"

import { TargetsClient } from "@/components/targets/targets-client"

export const metadata: Metadata = {
  title: "Targets",
  description: "Manage the article pages and target keywords Mentiohunt discovers opportunities for.",
  robots: { index: false, follow: false },
}

export default function TargetsPage() {
  return <TargetsClient />
}
