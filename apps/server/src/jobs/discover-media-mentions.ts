import { createLogger } from "../helpers/logger.js"
import { discoverMediaMentions } from "../methods/media-mentions/discover-media-mentions.js"

const log = createLogger("job-discover-media-mentions")

export async function runDiscoverMediaMentions(): Promise<void> {
  log.info("job started")
  try {
    await discoverMediaMentions()
    log.info("job finished")
  } catch (err) {
    log.error("job failed", { error: String(err) })
  }
}
