import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import pLimit from "p-limit"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import {
  discoverResourcePageInclusions,
  type ResourcePageInclusionOptions,
} from "../methods/prospect-generation-methods/resource-page-inclusion/index.js"
import type { ProspectCreatedPayload } from "../methods/prospect-generation-methods/shared/prospect-types.js"
import { assignSequences, createSequencesForProspect } from "../processes/onboarding/prospect-sequences.js"
import { resolveEmailAccount } from "../processes/onboarding/resolve-email-account.js"

const log = createLogger("route-dev-discover-resource-page-inclusions")

export const devDiscoverResourcePageInclusionsRouter: IRouter = Router()

type RequestBody = ResourcePageInclusionOptions & {
  productId?: string
  drMin?: number
  drMax?: number | null
}

function numberOrUndefined(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined
  return value
}

function stringArrayOrUndefined(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
}

devDiscoverResourcePageInclusionsRouter.post("/dev/discover-resource-page-inclusions", async (req, res) => {
  const body = req.body as RequestBody
  const productId = typeof body.productId === "string" ? body.productId.trim() : ""

  if (!productId) {
    res.status(400).json({ error: "productId required" })
    return
  }

  await withRouteLog(`dev-discover-resource-page-inclusions-${productId}`, async () => {
    log.info("starting", { productId, dryRun: body.dryRun === true })

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, user_id, product_name, product_description, website_url")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      log.warn("product not found", { productId })
      res.status(404).json({ error: "product not found" })
      return
    }

    const { data: settings } = await supabaseAdmin
      .from("backlink_prospects_settings")
      .select("dr_min, dr_max, voice_tone, offering")
      .eq("product_id", productId)
      .single()

    const filterSettings = {
      dr_min: body.drMin ?? settings?.dr_min ?? 0,
      dr_max: body.drMax !== undefined ? body.drMax : settings?.dr_max ?? null,
    }

    const emailSettings = {
      voice_tone: settings?.voice_tone ?? null,
      offering: settings?.offering ?? null,
    }

    const options: ResourcePageInclusionOptions = {
      pageIds: stringArrayOrUndefined(body.pageIds),
      pageTypes: stringArrayOrUndefined(body.pageTypes),
      queryTemplates: stringArrayOrUndefined(body.queryTemplates),
      maxPages: numberOrUndefined(body.maxPages),
      maxQueriesPerPage: numberOrUndefined(body.maxQueriesPerPage),
      maxCandidates: numberOrUndefined(body.maxCandidates),
      maxProspects: numberOrUndefined(body.maxProspects),
      serpResultsPerQuery: body.serpResultsPerQuery,
      maxPriority: numberOrUndefined(body.maxPriority),
      country: typeof body.country === "string" ? body.country : undefined,
      scoringThreshold: numberOrUndefined(body.scoringThreshold),
      dryRun: body.dryRun === true,
    }

    log.info("product loaded", {
      productId,
      product_name: product.product_name,
      dr_min: filterSettings.dr_min,
      dr_max: filterSettings.dr_max,
      options,
    })

    try {
      const account = await resolveEmailAccount(product.user_id)
      const seqLimit = pLimit(3)
      const seqPromises: Promise<void>[] = []
      const onProspectCreated: ((p: ProspectCreatedPayload) => void) | undefined = account
        ? (prospect) => {
            seqPromises.push(seqLimit(() => createSequencesForProspect(prospect, account)))
          }
        : undefined

      const result = await discoverResourcePageInclusions(
        product,
        filterSettings,
        emailSettings,
        options,
        undefined,
        onProspectCreated
      )
      log.info("done", { productId, ...result })

      if (seqPromises.length > 0) {
        log.info("awaiting sequence tasks", { productId, count: seqPromises.length })
        await Promise.allSettled(seqPromises)
      }

      if (!result.dryRun && result.prospectsCreated > 0) {
        await assignSequences(product.user_id, product.id, account)
      }

      res.json({ ok: true, productId, product_name: product.product_name, ...result })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { productId, error: msg })
      res.status(502).json({ error: msg })
    }
  })
})
