import { Router, type IRouter } from "express"
import { withRouteLog } from "../helpers/logger.js"
import { checkProductDirectoryOpportunities } from "../methods/directories/check-product-directories.js"

export const directoryOpportunitiesRouter: IRouter = Router()

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
      const result = await withRouteLog(
        `find-directory-opportunities-${productId}`,
        () => checkProductDirectoryOpportunities(productId)
      )
      res.json(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      res.status(500).json({ error: message })
    }
  }
)
