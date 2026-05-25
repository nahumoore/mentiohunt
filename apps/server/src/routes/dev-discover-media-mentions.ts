import { Router, type IRouter } from "express"
import { withRouteLog } from "../helpers/logger.js"
import { discoverMediaMentions } from "../methods/media-mentions/discover-media-mentions.js"

export const devDiscoverMediaMentionsRouter: IRouter = Router()

devDiscoverMediaMentionsRouter.post("/run/discover-media-mentions", async (_req, res) => {
  res.json({ status: "started" })
  await withRouteLog("discover-media-mentions", () => discoverMediaMentions())
})
