import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

const navigation = [
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#target-personas", label: "For Who" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/about", label: "About" },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-background/95 to-transparent px-4 pt-4 pb-1 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4 rounded-full border border-border/70 bg-card/85 px-4 py-2.5 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.1)] ring-1 ring-white/10 backdrop-blur-xl ring-inset sm:px-5 dark:shadow-[0_2px_20px_-4px_rgba(0,0,0,0.35)]">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-blaze-orange)] to-[var(--color-amber-flame)] text-sm font-bold text-white shadow-sm">
              M
            </span>
            <span className="font-heading text-base font-semibold tracking-tight">
              <span className="text-foreground">Mentio</span>
              <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
                hunt
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden rounded-full text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <Link href="/signin">Login</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full px-5 shadow-sm shadow-primary/20"
            >
              <Link href="/signup">Start for free</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
