import { Footer } from "./footer"
import { Navbar } from "./navbar"

type LegalSection = {
  title: string
  body: string[]
}

type LegalPageProps = {
  eyebrow: string
  title: string
  intro: string
  updatedAt: string
  sections: LegalSection[]
}

export function LegalPage({
  eyebrow,
  title,
  intro,
  updatedAt,
  sections,
}: LegalPageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,rgba(255,133,0,0.16),transparent_60%)]" />

      <Navbar />

      <div className="mx-auto flex max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-border bg-card/90 px-6 py-10 shadow-[0_20px_70px_-28px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-8 sm:py-12 lg:mt-10 lg:px-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-glow)]/70 to-transparent" />

          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.68rem] font-semibold text-[var(--color-princeton-orange)] uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {intro}
            </p>
            <p className="mt-5 text-sm font-medium text-foreground/75">
              Last updated {updatedAt}
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[1.5rem] border border-border bg-background/70 p-5 sm:p-6"
              >
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground sm:text-[0.95rem]">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
