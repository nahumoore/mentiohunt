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
    <header className="border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 text-sm font-semibold tracking-tight"
        >
          <span className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-base font-semibold">
            m
          </span>
          <span className="font-heading text-base">Mentiohunt</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
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
            className="hidden sm:inline-flex"
          >
            <Link href="#pricing">Pricing</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="#queue-preview">Preview Queue</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
