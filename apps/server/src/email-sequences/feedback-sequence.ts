import {
  FOUNDER_FROM,
  INBOUND_DOMAIN,
  PRIMARY_EMAIL,
} from "@workspace/supabase/email-settings"
import { Resend } from "resend"
import { createLogger } from "../helpers/logger.js"
export type FunnelStage =
  | "stuck_onboarding"
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
        previewText: "last email, won't follow up after this",
        body: `${greeting} ${name},

Last email, I won't follow up after this.

If there was a reason you dropped off, even one word helps (bad UX / too confusing / just didn't need it). Your account is still there if you ever want to give it another shot :)

Either way, appreciate you for trying it.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    default:
      return {
        subject: spin(
          "{before I let you go|one last thing|one week in, quick question}"
        ),
        previewText: "one question after your first week",
        body: `${greeting} ${name},

Last email, I promise.

One question: what's the one thing that would make Mentiohunt noticeably more useful for ${productName ?? "you"}? Could be a missing feature, something confusing, or a workflow that doesn't quite fit.

I'm building this for founders like you, so your answer directly shapes what gets built next :)

${signoff},
Nico
Founder @ Mentiohunt`,
      }
  }
}

const STEP_SUBJECTS = [step0Content, step1Content, step2Content]

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
