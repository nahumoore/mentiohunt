import type { Icon } from "@tabler/icons-react"

export function ToolHero({
  icon: Icon,
  eyebrow = "Free tool · no sign-up",
  title,
  highlight,
  description,
}: {
  icon: Icon
  eyebrow?: string
  title: string
  highlight: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blaze-orange/25 bg-blaze-orange/7 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-(--color-princeton-orange)">
        {eyebrow}
      </span>

      <div className="mt-5 flex items-center justify-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-blaze-orange)] to-[var(--color-amber-flame)] shadow-md shadow-primary/25">
          <Icon size={26} stroke={2} className="text-white" />
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
          {title}{" "}
          <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
            {highlight}
          </span>
        </h1>
      </div>

      <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
        {description}
      </p>
    </div>
  )
}
