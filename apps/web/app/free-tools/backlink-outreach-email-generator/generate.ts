export type OutreachType =
  | "guest-post"
  | "broken-link"
  | "resource-page"
  | "unlinked-mention"

export interface OutreachEmail {
  type: OutreachType
  subject: string
  body: string
  followUp: string
  note: string
}

export interface OutreachInput {
  yourName: string
  yourCompany: string
  targetSite: string
  recipientName?: string
  articleTopic: string
  articleUrl?: string
}

const TYPE_LABELS: Record<OutreachType, string> = {
  "guest-post": "Guest post pitch",
  "broken-link": "Broken link fix",
  "resource-page": "Resource page ask",
  "unlinked-mention": "Unlinked mention",
}

export { TYPE_LABELS }

function greeting(recipientName?: string): string {
  const name = recipientName?.trim()
  return name ? `Hi ${name}` : "Hi there"
}

function sign(input: OutreachInput): string {
  return `${input.yourName}\n${input.yourCompany}`
}

export function generateOutreachEmails(
  input: OutreachInput
): OutreachEmail[] {
  const yourName = input.yourName.trim()
  const yourCompany = input.yourCompany.trim()
  const targetSite = input.targetSite.trim()
  const articleTopic = input.articleTopic.trim()

  if (!yourName || !yourCompany || !targetSite || !articleTopic) return []

  const recipientName = input.recipientName?.trim()
  const articleUrl = input.articleUrl?.trim()
  const g = greeting(recipientName)
  const signature = sign(input)
  const articleRef = articleUrl ? `${articleTopic} (${articleUrl})` : articleTopic

  const results: OutreachEmail[] = []

  results.push({
    type: "guest-post",
    subject: `Guest post idea for ${targetSite}`,
    body: `${g},

I've been reading ${targetSite} and noticed you cover ${articleTopic} for your audience. I run ${yourCompany} and put together a piece on ${articleRef} that would fit well alongside that coverage.

Happy to write something original for your readers, or adapt what I already have to match your editorial style and length. No fee expected — I'm looking to contribute value, not just a link.

Would a guest post on this fit your upcoming content plan?

${signature}`,
    followUp: `${g},

Following up in case this got buried — still happy to put together a draft on ${articleTopic} for ${targetSite} whenever it's useful. Let me know if there's a better angle you'd rather see covered.

${signature}`,
    note: "Use when the site publishes contributor content and your topic clearly extends what they already cover. Lead with their content, not your pitch.",
  })

  results.push({
    type: "broken-link",
    subject: `Found a broken link on ${targetSite}`,
    body: `${g},

I was reading through ${targetSite} and ran into a link that no longer resolves on a page covering ${articleTopic}. Thought you'd want to know before it affects more readers.

I also happen to have a resource on ${articleRef} that covers similar ground, if you're looking for a replacement while you fix the page. No obligation either way — just flagging the broken link.

${signature}`,
    followUp: `${g},

Just checking whether the broken link I mentioned got sorted. If you still need a replacement for that section, the resource on ${articleTopic} I sent over is ready whenever it's useful.

${signature}`,
    note: "Only send this after you've actually verified the broken link — the value of this angle depends on it being true, not just plausible.",
  })

  results.push({
    type: "resource-page",
    subject: `Addition for your ${articleTopic} resource page`,
    body: `${g},

I came across your resource page on ${targetSite} covering ${articleTopic} — solid list. I put together ${articleRef} at ${yourCompany} that I think would be a useful addition for the same readers.

If it's a fit, would you consider adding it to the page? Happy to send more context on what it covers if that helps you decide.

${signature}`,
    followUp: `${g},

Wanted to follow up on the resource I suggested for your ${articleTopic} page. Let me know if you need anything else from me to make a call on it.

${signature}`,
    note: "Works best on pages explicitly curating links (\"resources\", \"tools we recommend\") rather than regular blog posts — the intent to add more links already exists.",
  })

  results.push({
    type: "unlinked-mention",
    subject: `Thanks for mentioning ${yourCompany}`,
    body: `${g},

Saw that ${targetSite} mentioned ${yourCompany} in a piece on ${articleTopic} — appreciate the shoutout. I noticed the mention isn't currently linked, so readers who want to check us out have to search for us.

Would you mind adding a link back to us where we're mentioned? Happy to share the exact URL to make it a quick edit.

${signature}`,
    followUp: `${g},

Just following up on the unlinked mention of ${yourCompany} in your ${articleTopic} piece — let me know if you need the URL again or any other details to add the link.

${signature}`,
    note: "Highest reply rate of the four angles — you're asking for a small edit to content that already exists and already mentions you.",
  })

  return results
}
