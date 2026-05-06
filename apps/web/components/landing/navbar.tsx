import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

const navigation = [
  { href: "#hero", label: "Overview" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#target-personas", label: "For Who" },
  { href: "#pricing", label: "Pricing" },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4 rounded-full border border-border bg-card/90 px-4 py-3 shadow-md backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-5">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-semibold tracking-tight"
          >
            <span className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-base font-semibold">
              m
            </span>
            <span className="font-heading text-base">Mentiohunt</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-full sm:inline-flex"
            >
              <Link href="#pricing">Pricing</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link href="#queue-preview">See Demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
