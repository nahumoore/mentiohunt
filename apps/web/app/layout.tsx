import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google"
import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import type { Metadata } from "next"
import { Figtree, Inter } from "next/font/google"
import Script from "next/script"
import { Toaster } from "sonner"

import { PlaybookExitModal } from "@/components/playbook-modal/playbook-exit-modal"
import { SupportChatWidget } from "@/components/support-chat/support-chat-widget"
import { PostHogProvider } from "@/components/analytics/posthog-provider"

export const metadata: Metadata = {
  metadataBase: new URL("https://mentiohunt.com"),
  title: {
    default: "Mentiohunt – Backlink Outreach Autopilot for Founders",
    template: "%s — Mentiohunt",
  },
  description:
    "Turn your article URLs into a backlink opportunity queue — with fit scoring, contact details, and outreach drafts ready to send.",
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

/**
 * Display face for landing headlines (DESIGN.md). Exposed as a CSS variable
 * only — nothing inherits it unless it opts in.
 */
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["500", "600", "700", "800"],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        inter.variable,
        figtree.variable,
        "font-sans"
      )}
    >
      {process.env.NODE_ENV !== "development" && (
        <GoogleTagManager gtmId="GTM-TC66Z7LR" />
      )}
      <body className="overflow-x-hidden">
        <PostHogProvider>{children}</PostHogProvider>
        <Toaster richColors position="top-right" />
        <SupportChatWidget />
        <PlaybookExitModal />

        {process.env.NODE_ENV !== "development" && (
          <>
            {/* GOOGLE ANALYTICS */}
            <GoogleAnalytics gaId="G-61WK6YY5RC" />

            {/* AHREFS */}
            <Script
              async
              data-key="n8BGKFLockEdDXdS3Vb+Jw"
              src="https://analytics.ahrefs.com/analytics.js"
              strategy="afterInteractive"
            />
          </>
        )}
      </body>
    </html>
  )
}
