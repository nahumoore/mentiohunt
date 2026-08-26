import type { Metadata } from "next"

import { LinkTrackerClient } from "@/components/link-tracker/link-tracker-client"

export const metadata: Metadata = {
  title: "Link Tracker",
  description: "Track the status and position of every backlink Mentiohunt has placed for you.",
  robots: { index: false, follow: false },
}

export default function LinkTrackerPage() {
  return <LinkTrackerClient />
}
