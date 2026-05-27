import { createLogger } from "../../helpers/logger.js"
import type { GatheredPost } from "./gather-posts.js"

const log = createLogger("reply-queue-filter-duplicates")

export function filterDuplicates(posts: GatheredPost[]): GatheredPost[] {
  // Sort descending by engagement so when we dedup by title we keep the top post
  const sorted = [...posts].sort((a, b) => b.engagement - a.engagement)

  const seenPostIds = new Set<string>()
  const seenTitles = new Set<string>()

  let droppedDuplicate = 0
  let droppedNoContent = 0
  let droppedCrosspost = 0

  const result: GatheredPost[] = []

  for (const post of sorted) {
    const postKey = `${post.platform}:${post.post_id}`

    if (seenPostIds.has(postKey)) {
      droppedDuplicate++
      continue
    }
    seenPostIds.add(postKey)

    if (post.is_crosspost) {
      droppedCrosspost++
      continue
    }

    if (!post.has_text_body) {
      droppedNoContent++
      continue
    }

    if (post.title) {
      const titleKey = `${post.platform}:${post.title.toLowerCase().trim()}`
      if (seenTitles.has(titleKey)) {
        droppedDuplicate++
        continue
      }
      seenTitles.add(titleKey)
    }

    result.push(post)
  }

  log.info("filter duplicates", {
    input: posts.length,
    output: result.length,
    droppedDuplicate,
    droppedNoContent,
    droppedCrosspost,
  })

  return result
}
