import type { Metadata } from "next"
import { addDays, format } from "date-fns"
import { redirect } from "next/navigation"
import { IconMailOff } from "@tabler/icons-react"
import { supabaseAdmin } from "@workspace/supabase/admin"
import type { Tables } from "@workspace/supabase/database-types"

import { PreviewAutoRefresh } from "@/components/onboarding/preview-auto-refresh"
import { PreviewResults } from "@/components/onboarding/preview/preview-results"
import { FREE_TRIAL_DAYS, PLANS } from "@/consts/billing"
import { supabaseServer } from "@/lib/supabase/server"
import { captureServerEvent } from "@/lib/server-analytics"

export const metadata: Metadata = {
  title: "Your opportunity preview",
  robots: { index: false, follow: false },
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

  // Failed runs and empty results share the same quiet, single-card treatment —
  // neither one has a list to sell, so they skip the paywall layout entirely.
  if (preview.status === "failed" || prospects.length === 0) {
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
          <section className="mt-4 rounded-3xl border border-border bg-card p-8">
            <h1 className="font-heading text-3xl font-semibold">
              {preview.status === "failed"
                ? "We couldn't finish this analysis"
                : "No strong matches yet"}
            </h1>
            <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
              {preview.status === "failed"
                ? "Your setup is safely stored. Our team can retry the preview without making you enter it again."
                : "We're not going to pretend weak results are opportunities. Your setup is saved so this run can be investigated and retried."}
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <>
      <PreviewAutoRefresh
        previewId={preview.id}
        status={preview.status}
        resultCount={preview.result_count}
      />
      <PreviewResults
        productName={product.product_name}
        websiteUrl={product.website_url}
        siteHost={siteHost}
        prospects={prospects}
        trialEndsOn={trialEnd}
        planPrice={pro.price}
        trialDays={FREE_TRIAL_DAYS}
        productId={preview.product_id}
      />
    </>
  )
}

export const dynamic = "force-dynamic"
