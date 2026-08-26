import {
  FOUNDER_FROM,
  INBOUND_DOMAIN,
  PRIMARY_EMAIL,
} from "@workspace/supabase/email-settings"
import { Resend } from "resend"
import { createLogger } from "../helpers/logger.js"
export type FunnelStage =
  | "stuck_onboarding"
  | "onboarding_payment_pending"
  | "onboarding_done_no_prospects"
  | "onboarding_done_no_action"
  | "used_opportunities_only"

const log = createLogger("feedback-sequence-email")

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("Missing RESEND_API_KEY")
  return new Resend(apiKey)
}

type EmailContent = { subject: string; previewText: string; body: string }

function spin(template: string): string {
  return template.replace(/\{([^}]+)\}/g, (_, options: string) => {
    const choices = options.split("|")
    return choices[Math.floor(Math.random() * choices.length)]!
  })
}

// Like spin, but safe for interpolated values (a product name containing
// "|" or "{" would corrupt a spin template).
function pick(...options: string[]): string {
  return options[Math.floor(Math.random() * options.length)]!
}

function step0Content(
  stage: FunnelStage,
  firstName: string | null,
  productName: string | null
): EmailContent {
  const name = firstName ?? "there"
  const greeting = spin("{Hi|Hello|Hey}")
  const signoff = spin("{Best|Cheers|Thanks}")

  switch (stage) {
    case "stuck_onboarding":
      return {
        subject: spin(
          "{quick question from the founder|hey, a quick thing|a second of your time}"
        ),
        previewText: "you started signing up, wondering what happened",
        body: `${greeting} ${name} - Nico here, founder of Mentiohunt :)

You started setting up but didn't finish. Did something feel confusing, or did life just get busy? Either way, a few words are more than enough.

Thanks for signing up!

${signoff} <3
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_payment_pending":
      return {
        subject: spin(
          "{one last step|quick question about your setup|what got in the way?}"
        ),
        previewText: "your setup is saved — what stopped you at the last step?",
        body: `${greeting} ${name} - Nico here, founder of Mentiohunt :)

You made it through setup and your product is saved, but it looks like you didn't finish the last step. Was it the card requirement, the trial terms, or did something else get in the way?

Reply with one line — I genuinely want to know.

${signoff} <3
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_done_no_prospects":
      return {
        subject: productName
          ? pick(
              `an update on ${productName}`,
              "quick heads up",
              "quick thing from the founder"
            )
          : spin(
              "{a quick update|quick heads up|quick thing from the founder}"
            ),
        previewText: "still searching, no opportunities found yet",
        body: `${greeting} ${name} - Nico here, founder of Mentiohunt :)

${
  productName
    ? `We finished setting up ${productName}, but haven't found any solid link building opportunities yet — we keep searching daily.`
    : `We finished onboarding, but haven't found any solid link building opportunities yet — we keep searching daily.`
}

That happens sometimes with a newer or more specific niche. Nothing wrong on your end, just wanted you to know it's not stuck.

Anything I can help with in the meantime? One line is enough.

Thanks for giving Mentiohunt a try!

${signoff} <3
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_done_no_action":
      return {
        subject: productName
          ? pick(
              `your results for ${productName} are waiting`,
              "just a heads up",
              "quick thing from the founder"
            )
          : spin(
              "{your results are waiting|just a heads up|quick thing from the founder}"
            ),
        previewText: "your backlink opportunities are ready to review",
        body: `${greeting} ${name} - Nico here, founder of Mentiohunt :)

${
  productName
    ? `You finished setting up ${productName} but haven't checked your results yet. Your link building opportunities are ready to review.`
    : `You finished onboarding but haven't checked your results yet. Your link building opportunities are ready to review.`
}

Anything getting in the way? One line is enough.

Thanks for giving Mentiohunt a try!

${signoff} <3
Nico
Founder @ Mentiohunt`,
      }
    case "used_opportunities_only":
      return {
        subject: productName
          ? pick(
              `how's the link building for ${productName} going?`,
              "quick check-in from the founder",
              "how's it going so far?"
            )
          : spin(
              "{how's Mentiohunt going?|quick check-in from the founder|how's it going so far?}"
            ),
        previewText: "you've been exploring link building, a quick check-in",
        body: `${greeting} ${name} - Nico here :)

${
  productName
    ? `I can see you've been looking at the link building opportunities we found for ${productName}. Are the sites we're surfacing actually a fit, or is anything feeling off?`
    : `I can see you've been looking at your link building opportunities. Are the results relevant to your site, or is anything feeling off?`
}

Thanks for giving Mentiohunt a try!

${signoff} <3
Nico
Founder @ Mentiohunt`,
      }
  }
}

function step1Content(
  stage: FunnelStage,
  firstName: string | null,
  productName: string | null
): EmailContent {
  const name = firstName ?? "there"
  const greeting = spin("{Hi again|Hey again|Hello again}")
  const signoff = spin("{Best|Cheers|Thanks}")

  switch (stage) {
    case "stuck_onboarding":
      return {
        subject: spin(
          "{was my last email too much?|honest question|still here if you need help}"
        ),
        previewText: "just trying to figure out what got in the way",
        body: `${greeting} ${name},

I'm just trying to figure out what actually got in the way. Was the setup confusing, or did something break on our end? I'd rather know than guess.

A few words are more than enough :)

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_payment_pending":
      return {
        subject: spin(
          "{did the last step give you pause?|still thinking it over?|honest question}"
        ),
        previewText: "was anything unclear about finishing your setup?",
        body: `${greeting} ${name},

You got through the setup, but didn't make it past the last step. Was anything unclear about the trial, the card requirement, or what happens next?

No pressure — just reply with whatever came to mind.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_done_no_prospects":
      return {
        subject: spin("{still on it|quick update|honest update}"),
        previewText: "still searching, no strong fits yet",
        body: `${greeting} ${name},

Still haven't surfaced opportunities for ${productName ?? "your product"} — we keep searching daily, but no strong fits yet.

If you want, reply and tell me more about ${productName ?? "your product"} or who you're trying to reach. That helps me tune the search.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_done_no_action":
      return {
        subject: spin(
          "{did anything catch your eye?|a few days in, curious|honest question}"
        ),
        previewText:
          "curious whether the results felt relevant to your product",
        body: `${greeting} ${name},

It's been a few days. Did you get a chance to look at your opportunities? I'm curious whether the results felt relevant to ${productName ?? "your product"} or totally off.

If something looked wrong, reply and tell me. That directly helps me improve the matching.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "used_opportunities_only":
      return {
        subject: productName
          ? pick(
              `are the opportunities a fit for ${productName}?`,
              "how are the link building results?",
              "quick one"
            )
          : spin(
              "{how are the link building results?|honest question|quick one}"
            ),
        previewText: "curious if the opportunities are a good fit",
        body: `${greeting} ${name},

You've been looking at the link building side for a few days. Are the opportunities a good fit for ${productName ?? "your site"}, or are too many of them off-target?

Honest feedback helps me tune the discovery logic. Just reply.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
  }
}

function step2Content(
  stage: FunnelStage,
  firstName: string | null,
  productName: string | null
): EmailContent {
  const name = firstName ?? "there"
  const greeting = spin("{Hi again|Hey again|Hello again}")
  const signoff = spin("{Best|Cheers|Thanks}")

  switch (stage) {
    case "stuck_onboarding":
      return {
        subject: spin("{before I let you go|one last thing|last one from me}"),
        previewText: "a quick onboarding check-in",
        body: `${greeting} ${name},

I wanted to check in before I leave you to it.

If there was a reason you dropped off, even one word helps (bad UX / too confusing / just didn't need it). Your account is still there if you ever want to give it another shot :)

Either way, appreciate you for trying it.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_payment_pending":
      return {
        subject: spin(
          "{should I change the last step?|one onboarding question|before I let you go}"
        ),
        previewText: "what would have helped you finish setup?",
        body: `${greeting} ${name},

One onboarding question: what would have helped you finish the last step? Was it the card requirement, the price, the trial terms, or something else?

Even one word helps me improve this.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    default:
      return {
        subject: spin(
          "{before I let you go|one thing|one week in, quick question}"
        ),
        previewText: "one question after your first week",
        body: `${greeting} ${name},

I wanted to check in before I leave you to it.

One question: what's the one thing that would make Mentiohunt noticeably more useful for ${productName ?? "you"}? Could be a missing feature, something confusing, or a workflow that doesn't quite fit.

I'm building this for founders like you, so your answer directly shapes what gets built next :)

${signoff},
Nico
Founder @ Mentiohunt`,
      }
  }
}

function step3Content(
  stage: FunnelStage,
  firstName: string | null,
  productName: string | null
): EmailContent {
  const name = firstName ?? "there"
  const signoff = spin("{Best|Cheers|Thanks}")

  switch (stage) {
    case "stuck_onboarding":
      return {
        subject: spin("{what stopped you?|one direct question|before I close this out}"),
        previewText: "what got in the way of continuing with onboarding?",
        body: `Hey ${name},

One direct question before I close this out: what stopped you from continuing with onboarding?

Was it confusing, too much work, something that broke, or simply not the right time? Reply with one word if that's all you have — it still helps.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_payment_pending":
      return {
        subject: spin("{what stopped you at the last step?|one direct question|still thinking it over?}"),
        previewText: "what would have helped you finish onboarding?",
        body: `Hey ${name},

One direct question before I close this out: what stopped you from continuing with onboarding?

Your product setup is saved, and the card step is the only thing left. Was it the card requirement, the trial terms, the price, or something else? Reply with one word if that's all you have.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    default:
      return {
        subject: spin("{one last question|before I close this out|quick final check-in}"),
        previewText: "what would make Mentiohunt more useful?",
        body: `Hey ${name},

One last question: what's the one thing that would make Mentiohunt more useful for ${productName ?? "you"}?

A missing feature, something confusing, or a workflow that didn't fit — reply with whatever comes to mind.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
  }
}

const STEP_SUBJECTS = [step0Content, step1Content, step2Content, step3Content]

export function buildReplyToAddress(token: string): string {
  return `reply-${token}@${INBOUND_DOMAIN}`
}

export async function sendFeedbackSequenceEmail({
  to,
  userId,
  userName,
  replyToken,
  step,
  stage,
  productName,
}: {
  to: string
  userId: string
  userName: string | null
  replyToken: string
  step: number
  stage: FunnelStage
  productName: string | null
}) {
  const firstName = userName?.trim().split(/\s+/)[0] ?? null
  const contentFn = STEP_SUBJECTS[step]
  if (!contentFn) {
    log.warn("no content for step", { step })
    return
  }

  const { subject, body } = contentFn(stage, firstName, productName)
  const replyTo = [PRIMARY_EMAIL, buildReplyToAddress(replyToken)]

  try {
    const resend = getResend()

    await resend.emails.send({
      from: FOUNDER_FROM,
      to,
      replyTo,
      subject,
      text: body,
    })

    log.info("feedback email sent", { userId, step, stage })
  } catch (err) {
    log.warn("failed to send feedback email", {
      error: String(err),
      userId,
      step,
    })
    throw err
  }
}
