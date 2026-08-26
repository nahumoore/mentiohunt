import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Prospects",
  description: "Review your ranked backlink opportunities and manage outreach for each one.",
  robots: { index: false, follow: false },
}

export default function ProspectsLayout({ children }: { children: React.ReactNode }) {
  return children
}
