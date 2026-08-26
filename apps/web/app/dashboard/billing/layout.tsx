import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your Mentiohunt plan, payment method, and subscription.",
  robots: { index: false, follow: false },
}

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return children
}
