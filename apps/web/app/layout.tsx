import { GoogleAnalytics } from "@next/third-parties/google"
import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import type { Metadata } from "next"
import { Google_Sans, Outfit } from "next/font/google"
import { Toaster } from "sonner"

import { PostHogIdentify } from "../components/posthog-identify"
import { PostHogInitializer } from "../components/posthog-initializer"

export const metadata: Metadata = {
  metadataBase: new URL("https://mentiohunt.com"),
  title: {
    default:
      "Mentiohunt – Backlink Placement Autopilot for Founders",
    template: "%s — Mentiohunt",
  },
  description:
    "Turn your article URLs into a backlink opportunity queue — with fit scoring, contact details, and outreach drafts ready to send.",
}

const outfitHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
})

const inter = Google_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
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
        outfitHeading.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="overflow-x-hidden">
        {/* <ThemeProvider> */}
        {children}
        <Toaster richColors position="top-center" />

        {process.env.NODE_ENV !== "development" && (
          <>
            {/* GOOGLE ANALYTICS */}
            <GoogleAnalytics gaId="G-61WK6YY5RC" />

            {/* POSTHOG */}
            <PostHogInitializer />
            <PostHogIdentify />
          </>
        )}
        {/* </ThemeProvider> */}
      </body>
    </html>
  )
}
