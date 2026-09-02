/** Real Mentiohunt customer sites — ranked by prospect activity in the DB. */
const sites = [
  { name: "Identify Digital", domain: "identifydigital.co.uk" },
  { name: "RiskQuilt", domain: "riskquilt.com" },
  { name: "WalletWallet", domain: "walletwallet.dev" },
  { name: "Position Digital", domain: "position.digital" },
  { name: "Aqute Intelligence", domain: "aqute.com" },
  { name: "An Artful Science", domain: "anartfulscience.com" },
  { name: "Design Henge", domain: "designhenge.com" },
  { name: "MRRescue", domain: "mrrescue.pro" },
  { name: "Knowitbroker", domain: "knowitbroker.com" },
  { name: "InsiderTradeAlerts", domain: "insidertradealerts.com" },
  { name: "Noticky", domain: "noticky.app" },
  { name: "WebReady", domain: "webready.bg" },
  { name: "The Fandom Ledger", domain: "fandomledger.com" },
  { name: "Trim Automation", domain: "trimautomation.com" },
  { name: "Kaboozt", domain: "kaboozt.com" },
]

export function TrustedByMarquee() {
  return (
    <div aria-labelledby="trusted-by-title" className="relative z-10 mb-10 sm:mb-12">
      <h2
        id="trusted-by-title"
        className="text-center font-[family-name:var(--font-figtree),var(--font-sans)] text-xs font-semibold text-muted-foreground uppercase sm:text-sm"
      >
        Sites already growing with Mentiohunt
      </h2>

      <div className="mx-auto mt-3 h-px w-10 bg-[var(--color-princeton-orange)]/70" />

      <div className="relative mx-auto mt-5 overflow-hidden py-5 sm:mt-6 sm:py-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-background via-background/90 to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-background via-background/90 to-transparent sm:w-28" />
        <div className="pointer-events-none absolute left-0 top-1/2 z-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-amber-glow)]/12 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/2 z-10 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-[var(--color-blaze-orange)]/10 blur-3xl" />

        <div className="flex w-max animate-[discovery-surfaces-marquee-right_48s_linear_infinite] items-center motion-reduce:animate-none">
          {[0, 1].map((loopIndex) => (
            <div
              key={loopIndex}
              aria-hidden={loopIndex === 1}
              className="flex shrink-0 items-center gap-4 pr-4 sm:gap-5 sm:pr-5"
            >
              {sites.map(({ name, domain }) => (
                <span
                  key={`${loopIndex}-${domain}`}
                  aria-label={loopIndex === 0 ? name : undefined}
                  role={loopIndex === 0 ? "img" : undefined}
                  className="flex shrink-0 items-center gap-2.5 rounded-full border border-border/60 bg-background/70 px-5 py-3 shadow-sm backdrop-blur grayscale transition-all duration-300 hover:grayscale-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                    alt={name}
                    width={20}
                    height={20}
                    className="rounded-sm"
                  />
                  <span className="whitespace-nowrap text-sm font-semibold text-foreground/80">
                    {name}
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
