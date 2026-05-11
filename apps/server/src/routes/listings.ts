import { Router, type IRouter } from "express";
import { withRouteLog } from "../helpers/logger.js";
import { checkProductListings } from "../methods/listings/check-product-listings.js";

export const listingsRouter: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// TODO: add auth middleware before exposing this to production
listingsRouter.post("/products/:productId/listings/check", async (req, res) => {
  const { productId } = req.params;

  if (!UUID_RE.test(productId)) {
    res.status(400).json({ error: "invalid productId" });
    return;
  }

  try {
    const result = await withRouteLog(`listings-check-${productId}`, () =>
      checkProductListings(productId),
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});
