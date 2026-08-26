import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Network",
  description: "Join the Mentiohunt backlink network to exchange links with other members.",
  robots: { index: false, follow: false },
}

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return children
}
