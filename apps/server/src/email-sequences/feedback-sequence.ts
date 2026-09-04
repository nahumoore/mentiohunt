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
  const greeting = spin("{Hi|Hey}")
  const signoff = spin("{Cheers|Thanks}")

  switch (stage) {
    case "stuck_onboarding":
      return {
        subject: spin(
          "{how did setup go?|anything I can help with?|a question about Mentiohunt}"
        ),
        previewText: "did you get stuck setting things up?",
        body: `${greeting} ${name},

I'm Nico, the founder of Mentiohunt.

Looks like you started setting things up but didn't get to the end. Did something trip you up, or did you just get pulled into something else?

If you got stuck, tell me where. Happy to help.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_payment_pending":
      return {
        subject: spin(
          "{a question about the trial|anything unclear about the trial?|how did setup go?}"
        ),
        previewText: "was there anything that made you hesitate?",
        body: `${greeting} ${name},

I'm Nico, the founder of Mentiohunt.

Your product setup is saved, but it looks like you haven't started the trial. Was it being asked for a card, something about the trial, or something else?

I'd love to understand what made you hesitate. It helps me figure out what to improve.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_done_no_prospects":
      return {
        subject: productName
          ? pick(
              `an update on ${productName}`,
              "quick heads up",
              "how the search is going"
            )
          : spin(
              "{a quick update|quick heads up|how the search is going}"
            ),
        previewText: "still searching, no opportunities found yet",
        body: `${greeting} ${name},

I'm Nico, the founder of Mentiohunt.

${
  productName
    ? `${productName} is set up, but we haven't found any sites that look like a good fit yet. We're still searching every day.`
    : `You're all set up, but we haven't found any sites that look like a good fit yet. We're still searching every day.`
}

I know it's not much fun to sign up and then wait for results. I wanted to let you know where things stand.

Are there any sites you'd love to see your product mentioned on? That would give me a better idea of what you're looking for.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_done_no_action":
      return {
        subject: productName
          ? pick(
              `found some opportunities for ${productName}`,
              "your first opportunities are ready",
              "got a chance to take a look?"
            )
          : spin(
              "{your first opportunities are ready|some sites to take a look at|got a chance to take a look?}"
            ),
        previewText: "your backlink opportunities are ready to review",
        body: `${greeting} ${name},

I'm Nico, the founder of Mentiohunt.

${
  productName
    ? `We've found some link building opportunities for ${productName}. Have you had a chance to take a look?`
    : `We've found some link building opportunities for your product. Have you had a chance to take a look?`
}

I'd love to hear whether these are the kinds of sites you had in mind.

Thanks for giving Mentiohunt a try!

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "used_opportunities_only":
      return {
        subject: productName
          ? pick(
              `how's the link building for ${productName} going?`,
              "what do you think of the sites so far?",
              "how's it going so far?"
            )
          : spin(
              "{how's Mentiohunt going?|what do you think of the sites so far?|how's it going so far?}"
            ),
        previewText: "are we finding the kinds of sites you had in mind?",
        body: `${greeting} ${name},

I'm Nico, the founder of Mentiohunt.

${
  productName
    ? `How do you feel about the sites we've found for ${productName}? Are they places you'd want your product mentioned?`
    : `How do you feel about the sites we've found for you? Are they places you'd want your product mentioned?`
}

If we're missing the mark, I'd love an example so I can understand why.

${signoff},
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
  const greeting = spin("{Hi|Hey}")
  const signoff = spin("{Cheers|Thanks}")

  switch (stage) {
    case "stuck_onboarding":
      return {
        subject: spin(
          "{did you get stuck somewhere?|how can I help with setup?|still here if you need help}"
        ),
        previewText: "just trying to figure out what got in the way",
        body: `${greeting} ${name},

Following up on my last email. Was there a part of setup that didn't make sense, or did something break?

I'm still working on making this easier, so even a rough description would help.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_payment_pending":
      return {
        subject: spin(
          "{any questions about the trial?|still thinking it over?|anything I can clear up?}"
        ),
        previewText: "was anything unclear about finishing your setup?",
        body: `${greeting} ${name},

Was there anything you wanted to know before starting the trial? Maybe what happens after it ends, or why we ask for a card?

Happy to talk it through if that would help.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_done_no_prospects":
      return {
        subject: spin("{still looking for a good fit|a search update|a note on your results}"),
        previewText: "still searching, no strong fits yet",
        body: `${greeting} ${name},

We still haven't found a good fit for ${productName ?? "your product"}. The search runs every day, but I know you're here for results.

Could you tell me a little about who you're trying to reach? That would help me see what we might be missing.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_done_no_action":
      return {
        subject: spin(
          "{did anything catch your eye?|what do you think so far?|had a chance to look?}"
        ),
        previewText:
          "curious whether the results felt relevant to your product",
        body: `${greeting} ${name},

Did you get a chance to look at the sites we found for ${productName ?? "your product"}? I'm curious whether any caught your eye.

If they weren't what you expected, what would a better fit look like?

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
              "any sites we should be finding?"
            )
          : spin(
              "{how are the link building results?|are we finding the right sites?|any sites we should be finding?}"
            ),
        previewText: "curious if the opportunities are a good fit",
        body: `${greeting} ${name},

Now that you've had a bit of time with Mentiohunt, are we finding the right kinds of sites for ${productName ?? "your product"}?

If there's a site you'd love us to find more like, send it my way. A concrete example helps me a lot.

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
  const greeting = spin("{Hi|Hey}")
  const signoff = spin("{Cheers|Thanks}")

  switch (stage) {
    case "stuck_onboarding":
      return {
        subject: spin("{could setup be easier?|a question about getting started|what would have helped?}"),
        previewText: "was setup more work than you expected?",
        body: `${greeting} ${name},

Was getting started with Mentiohunt more work than you expected?

If you remember where it got frustrating, I'd like to hear about it. And if you just didn't need it, that's useful to know too.

Your account is still there if you want to give it another go.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_payment_pending":
      return {
        subject: spin(
          "{what would have helped you decide?|a question about getting started|did you see enough to try it?}"
        ),
        previewText: "what would have helped you finish setup?",
        body: `${greeting} ${name},

Did you get enough of a feel for Mentiohunt to decide whether it's worth trying?

I'm wondering if we ask you to start a trial before you've seen enough. What would you have wanted to see first?

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    default:
      return {
        subject: spin(
          "{what's missing for you?|a week in, what do you think?|what would make this more useful?}"
        ),
        previewText: "one question after your first week",
        body: `${greeting} ${name},

You've had about a week with Mentiohunt now. What would make it more useful for ${productName ?? "you"}?

Could be something you expected it to do, something confusing, or a part that takes too much of your time.

I'm figuring out what to work on next, and I'd love to hear what matters to you.

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
  const signoff = spin("{Cheers|Thanks}")

  switch (stage) {
    case "stuck_onboarding":
      return {
        subject: spin("{one last note from me|thanks for trying Mentiohunt|anything you wish had been easier?}"),
        previewText: "thanks for giving it a look",
        body: `Hey ${name},

This is my last follow-up. Thanks for giving Mentiohunt a look.

If there's something you wish had been easier about getting started, I'm all ears. And if the timing just wasn't right, I get it.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    case "onboarding_payment_pending":
      return {
        subject: spin("{one last note about the trial|thanks for checking out Mentiohunt|anything else I can help with?}"),
        previewText: "your setup is saved if you want to come back",
        body: `Hey ${name},

This is my last follow-up about the trial. Your product setup is saved if you want to come back to it.

If the price, the card requirement, or anything else put you off, I'd appreciate hearing about it. It helps me understand what needs work.

${signoff},
Nico
Founder @ Mentiohunt`,
      }
    default:
      return {
        subject: spin("{one last note from me|thanks for trying Mentiohunt|anything you want me to know?}"),
        previewText: "what would make Mentiohunt more useful?",
        body: `Hey ${name},

I'll leave you to it after this, but I'd still love to know what would make Mentiohunt more useful for ${productName ?? "you"}.

If something comes to mind, now or later, just reply here. Thanks for giving it a try.

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
