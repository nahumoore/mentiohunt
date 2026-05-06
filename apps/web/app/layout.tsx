import { Inter, Outfit } from "next/font/google"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import { Toaster } from "sonner"

const outfitHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
})

const inter = Inter({
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
        {/* </ThemeProvider> */}
      </body>
    </html>
  )
}
