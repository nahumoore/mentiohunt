import { Router, type IRouter } from "express"
import { withRouteLog } from "../helpers/logger.js"
import {
  checkProductDirectoryOpportunities,
  type DirectoryOpportunitiesCheckOptions,
} from "../methods/directories/check-product-directories.js"

export const directoryOpportunitiesRouter: IRouter = Router()

export async function findDirectoryOpportunitiesForProduct(
  productId: string,
  options: DirectoryOpportunitiesCheckOptions = {}
) {
  return withRouteLog(`find-directory-opportunities-${productId}`, () =>
    checkProductDirectoryOpportunities(productId, options)
  )
}

directoryOpportunitiesRouter.post(
  "/find-directory-opportunities",
  async (req, res) => {
    const productId =
      typeof req.body.productId === "string" ? req.body.productId.trim() : ""

    if (!productId) {
      res.status(400).json({ error: "productId is required" })
      return
    }

    try {
      const result = await findDirectoryOpportunitiesForProduct(productId)
      res.json(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      res.status(500).json({ error: message })
    }
  }
)
