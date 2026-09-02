import type { Metadata } from "next"
import { addDays, format } from "date-fns"
import { redirect } from "next/navigation"
import { IconMailOff } from "@tabler/icons-react"
import { supabaseAdmin } from "@workspace/supabase/admin"
import type { Tables } from "@workspace/supabase/database-types"

import { PreviewAutoRefresh } from "@/components/onboarding/preview-auto-refresh"
import { PreviewProof } from "@/components/onboarding/preview-proof"
import { StartOutreachButton } from "@/components/onboarding/start-outreach-button"
import { FREE_TRIAL_DAYS, PLANS } from "@/consts/billing"
import { supabaseServer } from "@/lib/supabase/server"
import { captureServerEvent } from "@/lib/server-analytics"

export const metadata: Metadata = {
  title: "Your opportunity preview",
  robots: { index: false, follow: false },
}

function opportunityText(tier: string) {
  if (tier === "unlinked_mention") {
    return {
      reason:
        "This page already mentions your market, so a useful source link is a natural fit.",
      angle: "Offer your target page as the missing supporting source.",
    }
  }
  if (tier === "listicle_roundup") {
    return {
      reason:
        "This roundup reaches readers who are actively comparing products like yours.",
      angle:
        "Pitch a concise addition that highlights your clearest differentiator.",
    }
  }
  if (tier === "resource_page_inclusion") {
    return {
      reason:
        "This curated page covers the same topic as one of your strongest resources.",
      angle:
        "Offer the selected resource as a useful addition for its readers.",
    }
  }
  if (tier === "broken_link_building") {
    return {
      reason:
        "This page links to a resource that no longer works, and you have a relevant replacement.",
      angle:
        "Point out the broken link and offer your selected page as a low-pressure replacement.",
    }
  }
  return {
    reason:
      "This site already links to a close competitor and is relevant to your category.",
    angle: "Suggest your target page as a complementary or fresher resource.",
  }
}

function tierLabel(tier: string) {
  const labels: Record<string, string> = {
    unlinked_mention: "Unlinked mention",
    listicle_roundup: "Listicle roundup",
    resource_page_inclusion: "Resource page",
    broken_link_building: "Broken link",
  }
  return labels[tier] ?? "Competitor backlink"
}

export default async function OnboardingPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>
}) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/signin")

  const { data: preview } = await supabaseAdmin
    .from("onboarding_previews")
    .select(
      "id, product_id, status, result_count, result_ids, viewed_at, results_email_clicked_at, failure_reason"
    )
    .eq("user_id", user.id)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!preview) redirect("/onboarding")
  const resultIds = Array.isArray(preview.result_ids)
    ? (preview.result_ids as string[])
    : []

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("product_name, website_url")
    .eq("id", preview.product_id)
    .eq("user_id", user.id)
    .single()
  let prospectRows: Pick<
    Tables<"backlink_prospects">,
    | "id"
    | "domain"
    | "found_url"
    | "target_url"
    | "domain_rating"
    | "site_relevance_score"
    | "tier"
  >[] = []
  if (resultIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("backlink_prospects")
      .select(
        "id, domain, found_url, target_url, domain_rating, site_relevance_score, tier"
      )
      .eq("product_id", preview.product_id)
      .in("id", resultIds)
    prospectRows = data ?? []
  }
  if (!product) redirect("/onboarding")

  const byId = new Map(
    (prospectRows ?? []).map((prospect) => [prospect.id, prospect])
  )
  const prospects: typeof prospectRows = resultIds.flatMap((id: string) => {
    const prospect = byId.get(id)
    return prospect ? [prospect] : []
  })
  const isComplete = preview.status === "ready" || preview.status === "partial"
  const params = await searchParams

  if (isComplete && !preview.viewed_at) {
    const { data: viewed } = await supabaseAdmin
      .from("onboarding_previews")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", preview.id)
      .is("viewed_at", null)
      .select("id")
      .maybeSingle()
    if (viewed) {
      void captureServerEvent("onboarding_preview_viewed", user.id, {
        preview_id: preview.id,
        product_id: preview.product_id,
        result_count: preview.result_count,
        status: preview.status,
      })
    }
  }

  if (params.source === "email" && !preview.results_email_clicked_at) {
    const { data: clicked } = await supabaseAdmin
      .from("onboarding_previews")
      .update({ results_email_clicked_at: new Date().toISOString() })
      .eq("id", preview.id)
      .is("results_email_clicked_at", null)
      .select("id")
      .maybeSingle()
    if (clicked) {
      void captureServerEvent("onboarding_preview_email_clicked", user.id, {
        preview_id: preview.id,
        product_id: preview.product_id,
      })
    }
  }

  const pro = PLANS.find((plan) => plan.key === "pro")!
  const trialEnd = format(addDays(new Date(), FREE_TRIAL_DAYS), "MMMM d, yyyy")

  const siteHost = product.website_url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")

  if (!isComplete && preview.status !== "failed") {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
        <PreviewAutoRefresh
          previewId={preview.id}
          status={preview.status}
          resultCount={preview.result_count}
        />
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-[460px] w-[620px] -translate-x-1/2 -translate-y-[55%] rounded-full bg-primary/[0.07] blur-[110px]"
          aria-hidden
        />
        <div className="relative flex w-full max-w-md flex-col items-center text-center">
          <p className="text-[0.7rem] font-bold tracking-[0.22em] text-primary uppercase">
            Personalized preview
          </p>

          <div className="relative mt-7 h-[76px] w-[76px]">
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-primary/15 border-t-primary [animation-duration:0.95s]" />
            <div className="absolute inset-[13px] flex items-center justify-center overflow-hidden rounded-full border border-border bg-white">
              {/* Google's favicon service isn't in next.config remotePatterns,
                  so this stays a plain img. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${siteHost}&sz=64`}
                alt=""
                className="h-6 w-6"
              />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{siteHost}</span>
          </p>

          <h1 className="mt-3.5 font-heading text-[25px] leading-tight font-semibold tracking-tight text-balance">
            Building {product.product_name}&rsquo;s opportunity list
          </h1>
          <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Usually 2&ndash;3 minutes. Close this tab if you like &mdash;
            we&rsquo;ll email{" "}
            <strong className="font-semibold text-foreground">
              {user.email}
            </strong>{" "}
            when it&rsquo;s ready.
          </p>

          <ul className="mt-7 inline-flex flex-col gap-3 text-left">
            {[
              `Reading ${siteHost}’s target pages`,
              `Mining backlinks from ${product.product_name}’s competitors`,
              "Checking relevant sites for a real topical match",
              "Scoring each match on fit and domain strength",
            ].map((label, index) => (
              <li
                key={label}
                className="flex items-center gap-2.5 text-sm text-foreground/80"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 animate-loading-dot rounded-full bg-primary"
                  style={{ animationDelay: `${index * 200}ms` }}
                />
                {label}
              </li>
            ))}
          </ul>

          <div className="my-7 h-px w-10 bg-border" />
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconMailOff className="h-4 w-4" /> Nothing is being sent.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 sm:px-8 sm:py-16">
      <PreviewAutoRefresh
        previewId={preview.id}
        status={preview.status}
        resultCount={preview.result_count}
      />
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-primary">
          Personalized preview
        </p>
        {preview.status === "failed" ? (
          <section className="mt-4 rounded-3xl border border-border bg-card p-8">
            <h1 className="font-heading text-3xl font-semibold">
              We couldn&apos;t finish this analysis
            </h1>
            <p className="mt-3 text-muted-foreground">
              Your setup is safely stored. Our team can retry the preview
              without making you enter it again.
            </p>
          </section>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
                  Opportunities for {product.product_name}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  These are real matches from the initial analysis of{" "}
                  {product.website_url}. Nothing has been sent.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                {prospects.length} matches
              </span>
            </div>

            {prospects.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                <h2 className="font-heading text-xl font-semibold">
                  No strong matches yet
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  We&apos;re not going to pretend weak results are
                  opportunities. Your setup is saved so this run can be
                  investigated and retried.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-4">
                {prospects.map((prospect) => {
                  const copy = opportunityText(prospect.tier)
                  const isTopFit = prospect.site_relevance_score === 5
                  return (
                    <article
                      key={prospect.id}
                      className="relative rounded-2xl border border-border bg-card p-6"
                    >
                      {isTopFit && (
                        <span
                          className="absolute top-[18px] bottom-[18px] left-0 w-[3px] rounded-r bg-primary"
                          aria-hidden
                        />
                      )}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-border bg-white">
                            {/* Google's favicon service isn't in next.config
                                remotePatterns, so this stays a plain img. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${prospect.domain ?? product.website_url}&sz=64`}
                              alt=""
                              className="h-[22px] w-[22px]"
                            />
                          </span>
                          <div>
                            <h2 className="text-base font-semibold">
                              {prospect.domain ?? "Relevant site"}
                            </h2>
                            <p className="mt-0.5 text-xs break-all text-muted-foreground">
                              {prospect.found_url}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {prospect.domain_rating !== null && (
                            <span className="rounded-full bg-primary/10 px-2.5 py-1.5 font-semibold text-primary">
                              DR {prospect.domain_rating}
                            </span>
                          )}
                          {prospect.site_relevance_score !== null && (
                            <span className="rounded-full bg-primary/10 px-2.5 py-1.5 font-semibold text-primary">
                              Fit {prospect.site_relevance_score}/5
                            </span>
                          )}
                          <span className="rounded-full bg-muted px-2.5 py-1.5 font-semibold text-muted-foreground">
                            {tierLabel(prospect.tier)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-4 border-t border-border/70 pt-5 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">
                            Promote
                          </p>
                          <p className="mt-1 text-sm break-all">
                            {prospect.target_url ?? product.website_url}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">
                            Why it fits
                          </p>
                          <p className="mt-1 text-sm leading-6">
                            {copy.reason}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">
                            Suggested angle
                          </p>
                          <p className="mt-1 text-sm leading-6">{copy.angle}</p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {prospects.length > 0 && <PreviewProof />}

            {prospects.length > 0 && (
              <section className="mt-10 rounded-3xl border border-border bg-card p-7 sm:p-9">
                <h2 className="font-heading text-2xl font-semibold">
                  Ready for Mentiohunt to run the outreach?
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Your preview stays available if you leave or cancel Checkout.
                </p>
                <div className="mt-6">
                  <StartOutreachButton productId={preview.product_id} />
                </div>
                <p className="mt-4 max-w-3xl text-xs leading-5 text-muted-foreground">
                  $0 today. Card required. Your trial ends {trialEnd}, then $
                  {pro.price}/month. The subscription renews automatically
                  unless you cancel from Billing before then. We&apos;ll email
                  you about 2 days before the trial ends.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export const dynamic = "force-dynamic"
