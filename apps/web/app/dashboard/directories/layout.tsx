import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Directories",
  description: "Browse curated directories to submit your site for extra backlinks.",
  robots: { index: false, follow: false },
}

export default function DirectoriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
