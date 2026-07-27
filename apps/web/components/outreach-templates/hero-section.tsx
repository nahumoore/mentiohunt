import { OutreachTemplateSearchInput } from "./search-input"

export function OutreachTemplatesHeroSection({
  query,
  resultCount,
  totalCount,
}: {
  query: string
  resultCount: number
  totalCount: number
}) {
  const countLabel = query
    ? `${resultCount} of ${totalCount} templates`
    : `${totalCount} template${totalCount === 1 ? "" : "s"} · updated weekly`

  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-princeton-orange/10 blur-[120px]" />
        <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-amber-glow/8 blur-[100px]" />
        <div className="absolute -right-16 top-20 h-72 w-72 rounded-full bg-blaze-orange/8 blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            Outreach email library
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[4.2rem] lg:leading-[0.98]">
            Link outreach emails,{" "}
            <span className="bg-gradient-to-r from-(--color-blaze-orange) to-(--color-amber-glow) bg-clip-text text-transparent">
              worth replying to.
            </span>
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Every template below is a real outreach email we send on behalf
            of founders — with the reasoning behind each line. Copy one, or
            let us run the whole thing for you.
          </p>
        </div>

        <div className="mx-auto mt-9 max-w-[560px]">
          <OutreachTemplateSearchInput initialQuery={query} />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {countLabel}
        </p>
      </div>
    </section>
  )
}
