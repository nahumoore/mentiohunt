import { GoogleAnalytics } from "@next/third-parties/google"
import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import type { Metadata } from "next"
import { Bricolage_Grotesque, Figtree, Inter } from "next/font/google"
import Script from "next/script"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  metadataBase: new URL("https://mentiohunt.com"),
  title: {
    default: "Mentiohunt – Backlink Placement Autopilot for Founders",
    template: "%s — Mentiohunt",
  },
  description:
    "Turn your article URLs into a backlink opportunity queue — with fit scoring, contact details, and outreach drafts ready to send.",
}

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
})

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600"],
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
        figtree.variable,
        bricolageGrotesque.variable,
        inter.variable,
        "font-sans"
      )}
    >
      <body className="overflow-x-hidden">
        {/* <ThemeProvider> */}
        {children}
        <Toaster richColors position="top-right" />

        {process.env.NODE_ENV !== "development" && (
          <>
            {/* GOOGLE ANALYTICS */}
            <GoogleAnalytics gaId="G-61WK6YY5RC" />

            {/* PLAUSIBLE */}
            <Script
              async
              data-domain="mentiohunt.com"
              src="https://analytics.karmicup.com/js/pa-asroR_guo18EFSBbZh8_M.js"
              strategy="afterInteractive"
            />
            <Script id="plausible-init" strategy="afterInteractive">{`
              window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
              plausible.init()
            `}</Script>

            {/* CRISP */}
            <Script id="crisp-chat" strategy="afterInteractive">{`
              window.$crisp=[];window.CRISP_WEBSITE_ID="a5eafad7-0838-4b9a-af68-808afe9d0535";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();
            `}</Script>
          </>
        )}
        {/* </ThemeProvider> */}
      </body>
    </html>
  )
}
