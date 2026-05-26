import { FOUNDER_FROM } from "@workspace/supabase/email-settings"
import { Resend } from "resend"
import { createLogger } from "../logger.js"
import type { FunnelStage } from "../posthog-query.js"
import { escapeHtml, mentiohuntTemplate } from "./email-template.js"
import { generateUnsubscribeUrl } from "./unsubscribe.js"

const log = createLogger("feedback-sequence-email")

const INBOUND_DOMAIN = "xaipreno.resend.app"

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("Missing RESEND_API_KEY")
  return new Resend(apiKey)
}

export function buildReplyToAddress(token: string): string {
  return `reply-${token}@${INBOUND_DOMAIN}`
}

type EmailContent = { subject: string; previewText: string; body: string }

function spin(template: string): string {
  return template.replace(/\{([^}]+)\}/g, (_, options: string) => {
    const choices = options.split("|")
    return choices[Math.floor(Math.random() * choices.length)]!
  })
}

function p(text: string): string {
  return `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;color:#4A413B;margin:0 0 18px;line-height:1.7;">${text}</p>`
}

function step0Content(
  stage: FunnelStage,
  firstName: string | null
): EmailContent {
  const name = firstName ? escapeHtml(firstName) : "there"
  const greeting = spin("{Hi|Hello|Hey}")
  const signoff = spin("{Best|Cheers|Thanks}")

  switch (stage) {
    case "stuck_onboarding":
      return {
        subject: spin(
          "{quick question from the founder|hey, a quick thing|a second of your time}"
        ),
        previewText: "you started signing up, wondering what happened",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("Nico here, founder of Mentiohunt :)")}
          ${p("You started setting up but didn't finish. Did something feel confusing, or did life just get busy? Either way, one line is more than enough.")}
          ${p(`${signoff} &lt;3`)}
        `,
      }
    case "onboarding_done_no_action":
      return {
        subject: spin(
          "{your results are waiting|just a heads up|quick thing from the founder}"
        ),
        previewText: "your reply queue and backlink opportunities are ready",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("Nico here, founder of Mentiohunt :)")}
          ${p("You finished onboarding but haven't checked your results yet. Your reply queue and link building opportunities are ready to review.")}
          ${p("Anything getting in the way? One line is enough.")}
          ${p(`${signoff} &lt;3`)}
        `,
      }
    case "used_mentions_only":
      return {
        subject: spin(
          "{how's Mentiohunt going?|quick check-in from the founder|how's it going so far?}"
        ),
        previewText: "you've been monitoring mentions, a quick check-in",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("Nico here :)")}
          ${p("I can see you've been using the community reply queue. Have you also checked the link building side? There should be directory and backlink opportunities waiting for you.")}
          ${p("Anything confusing so far? Just reply.")}
          ${p(`${signoff} &lt;3`)}
        `,
      }
    case "used_opportunities_only":
      return {
        subject: spin(
          "{how's Mentiohunt going?|quick check-in from the founder|how's it going so far?}"
        ),
        previewText: "you've been exploring link building, a quick check-in",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("Nico here :)")}
          ${p("I can see you've been looking at your link building opportunities. Have you also checked the community reply queue? Mentiohunt tracks posts that mention your product so you can reply while threads are still active.")}
          ${p("Anything confusing so far? Just reply.")}
          ${p(`${signoff} &lt;3`)}
        `,
      }
    case "used_both":
      return {
        subject: spin(
          "{how's your first day going?|how's Mentiohunt going?|quick check-in from the founder}"
        ),
        previewText: "you've been exploring both sides, how's it feeling?",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("Nico here :)")}
          ${p("I can see you've been exploring both the reply queue and the link building side. How's it going so far? Anything working well or anything that seems off?")}
          ${p("Just reply here, I read everything.")}
          ${p(`${signoff} &lt;3`)}
        `,
      }
  }
}

function step1Content(
  stage: FunnelStage,
  firstName: string | null
): EmailContent {
  const name = firstName ? escapeHtml(firstName) : "there"
  const greeting = spin("{Hi again|Hey again|Hello again}")
  const signoff = spin("{Best|Cheers|Thanks}")

  switch (stage) {
    case "stuck_onboarding":
      return {
        subject: spin(
          "{was my last email too much?|honest question|still here if you need help}"
        ),
        previewText: "just trying to figure out what got in the way",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("I'm just trying to figure out what actually got in the way. Was the setup confusing, or did something break on our end? I'd rather know than guess.")}
          ${p("One line is more than enough :)")}
          ${p(`${signoff},`)}
          ${p("Nicolas")}
        `,
      }
    case "onboarding_done_no_action":
      return {
        subject: spin(
          "{did anything catch your eye?|a few days in, curious|honest question}"
        ),
        previewText: "curious whether the results felt relevant to your product",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("It's been a few days. Did you get a chance to look at your opportunities? I'm curious whether the results felt relevant to your product or totally off.")}
          ${p("If something looked wrong, reply and tell me. That directly helps me improve the matching.")}
          ${p(`${signoff},`)}
          ${p("Nicolas")}
        `,
      }
    case "used_mentions_only":
      return {
        subject: spin(
          "{what's the reply queue like for you?|honest question|quick one}"
        ),
        previewText: "are the community matches actually relevant?",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("You've been using the community reply queue for a few days. Are the matches relevant? Too many, too few?")}
          ${p("I want to know what's actually useful vs. what's noise. Just reply.")}
          ${p(`${signoff},`)}
          ${p("Nicolas")}
        `,
      }
    case "used_opportunities_only":
      return {
        subject: spin(
          "{how are the link building results?|honest question|quick one}"
        ),
        previewText: "curious if the opportunities are a good fit",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("You've been looking at the link building side for a few days. Are the opportunities a good fit for your site, or are too many of them off-target?")}
          ${p("Honest feedback helps me tune the discovery logic. Just reply.")}
          ${p(`${signoff},`)}
          ${p("Nicolas")}
        `,
      }
    case "used_both":
      return {
        subject: spin(
          "{what's working for you?|a few days in, curious|honest question}"
        ),
        previewText: "which side has been most useful so far?",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("You've been using both the reply queue and the link building side. Which one feels more useful for where you are right now? And what's the biggest thing missing?")}
          ${p("Reply here, I read everything.")}
          ${p(`${signoff},`)}
          ${p("Nicolas")}
        `,
      }
  }
}

function step2Content(
  stage: FunnelStage,
  firstName: string | null
): EmailContent {
  const name = firstName ? escapeHtml(firstName) : "there"
  const greeting = spin("{Hi again|Hey again|Hello again}")
  const signoff = spin("{Best|Cheers|Thanks}")

  switch (stage) {
    case "stuck_onboarding":
      return {
        subject: spin(
          "{before I let you go|one last thing|last one from me}"
        ),
        previewText: "last email, won't follow up after this",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("Last email, I won't follow up after this.")}
          ${p("If there was a reason you dropped off, even one word helps (bad UX / too confusing / just didn't need it). Your account is still there if you ever want to give it another shot :)")}
          ${p("Either way, appreciate you for trying it.")}
          ${p(`${signoff} &lt;3`)}
          ${p("Nicolas")}
        `,
      }
    default:
      return {
        subject: spin(
          "{before I let you go|one last thing|one week in, quick question}"
        ),
        previewText: "one question after your first week",
        body: `
          ${p(`${greeting} ${name},`)}
          ${p("Last email, I promise.")}
          ${p("One question: what's the one thing that would make Mentiohunt noticeably more useful for you? Could be a missing feature, something confusing, or a workflow that doesn't quite fit.")}
          ${p("I'm building this for founders like you, so your answer directly shapes what gets built next :)")}
          ${p(`${signoff},`)}
          ${p("Nicolas")}
        `,
      }
  }
}

const STEP_SUBJECTS = [step0Content, step1Content, step2Content]

export async function sendFeedbackSequenceEmail({
  to,
  userId,
  userName,
  replyToken,
  step,
  stage,
}: {
  to: string
  userId: string
  userName: string | null
  replyToken: string
  step: number
  stage: FunnelStage
}) {
  const firstName = userName?.trim().split(/\s+/)[0] ?? null
  const contentFn = STEP_SUBJECTS[step]
  if (!contentFn) {
    log.warn("no content for step", { step })
    return
  }

  const { subject, previewText, body } = contentFn(stage, firstName)
  const unsubscribeUrl = generateUnsubscribeUrl(userId, "marketing")
  const replyTo = buildReplyToAddress(replyToken)

  try {
    const resend = getResend()
    const email = mentiohuntTemplate({
      subject,
      body,
      previewText,
      footerReason: "You received this because you signed up for Mentiohunt.",
      unsubscribeUrl,
    })

    await resend.emails.send({
      from: FOUNDER_FROM,
      to,
      replyTo,
      subject: email.subject,
      html: email.html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
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
