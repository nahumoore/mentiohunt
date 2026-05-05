import Link from "next/link"

const links = [
  { href: "#how-it-works", label: "How it Works" },
  { href: "#target-personas", label: "For Who" },
  { href: "#pricing", label: "Pricing" },
  { href: "#hero", label: "Back to Top" },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto flex flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-md space-y-3">
          <p className="font-heading text-lg font-semibold tracking-tight">
            Mentiohunt
          </p>
          <p className="text-sm text-muted-foreground">
            A weekly operating system for backlink prospecting, fit scoring, and
            outreach prep.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <p>2026 Mentiohunt. Built for recurring backlink work.</p>
        </div>
      </div>
    </footer>
  )
}
