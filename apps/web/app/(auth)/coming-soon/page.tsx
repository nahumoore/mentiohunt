import type { Metadata } from "next"

import { AuthComingSoon } from "./coming-soon"

export const metadata: Metadata = {
  title: "Coming Soon - Mentiohunt",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ComingSoonPage() {
  return <AuthComingSoon />
}
