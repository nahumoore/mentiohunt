import { generateText } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../logger.js"
import { withLlmRetries } from "../llm-retry.js"
import { parseLlmJson } from "../parse-llm-json.js"

const log = createLogger("classify-inbound-email")

export type InboundClassification =
  | "human_reply"
  | "auto_reply"
  | "bounce"
  | "unsubscribe"
  | "negative_reply"
  | "wrong_person"
  | "challenge"
  | "needs_review"

export type ClassificationResult = {
  classification: InboundClassification
  confidence: number
  reason: string
}

export type HeaderMap = Record<string, string>

export function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase()
  return trimmed || null
}

export function normalizeMessageId(messageId: string | null | undefined): string | null {
  const trimmed = messageId?.trim().replace(/^<|>$/g, "")
  return trimmed ? trimmed.toLowerCase() : null
}

export function extractMessageIds(value: string | null | undefined): string[] {
  if (!value) return []
  const ids = value.match(/<[^>]+>|[^\s,]+/g) ?? []
  return ids.flatMap((id) => normalizeMessageId(id) ?? [])
}

export function normalizeSubject(subject: string | null | undefined): string {
  return (subject ?? "")
    .replace(/^\s*((re|fw|fwd)\s*:\s*)+/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

export function stripQuotedReply(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  const kept: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^on .+ wrote:$/i.test(trimmed)) break
    if (/^-{2,}\s*original message\s*-{2,}$/i.test(trimmed)) break
    if (/^from:\s.+/i.test(trimmed) && kept.length > 0) break
    if (/^>/.test(trimmed)) continue
    kept.push(line)
  }

  return kept
    .join("\n")
    .replace(/\n--\s*\n[\s\S]*$/m, "")
    .trim()
}

function textIncludes(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function headerValue(headers: HeaderMap, name: string): string {
  return headers[name.toLowerCase()] ?? ""
}

function isBounce(headers: HeaderMap, fromEmail: string | null, subject: string, body: string): ClassificationResult | null {
  const from = fromEmail ?? ""
  const contentType = headerValue(headers, "content-type")
  const combined = `${subject}\n${body}`

  if (
    /message\/delivery-status/i.test(contentType) ||
    /mailer-daemon|postmaster|mail delivery subsystem/i.test(from) ||
    textIncludes(subject, [/delivery status notification/i, /undeliver(?:ed|able)/i, /mail delivery failed/i]) ||
    textIncludes(combined, [
      /\b5\.1\.1\b/i,
      /\b5\.2\.2\b/i,
      /\b550\b/i,
      /recipient not found/i,
      /mailbox unavailable/i,
      /user unknown/i,
      /address not found/i,
    ])
  ) {
    return { classification: "bounce", confidence: 0.98, reason: "Delivery failure or DSN signals detected." }
  }

  return null
}

function isAutoReply(headers: HeaderMap, subject: string, body: string): ClassificationResult | null {
  const autoSubmitted = headerValue(headers, "auto-submitted")
  const precedence = headerValue(headers, "precedence")
  const combined = `${subject}\n${body}`

  if (
    /auto-replied|auto-generated/i.test(autoSubmitted) ||
    /auto_reply|bulk|junk/i.test(precedence) ||
    headerValue(headers, "x-autoreply") ||
    headerValue(headers, "x-autorespond") ||
    textIncludes(combined, [
      /out of office/i,
      /automatic reply/i,
      /auto(?:matic)? response/i,
      /vacation/i,
      /currently away/i,
      /away from (?:the )?office/i,
      /\booo\b/i,
    ])
  ) {
    return { classification: "auto_reply", confidence: 0.94, reason: "Automatic reply or out-of-office signals detected." }
  }

  return null
}

function isUnsubscribe(body: string): ClassificationResult | null {
  if (
    textIncludes(body, [
      /\bunsubscribe\b/i,
      /remove me/i,
      /take me off/i,
      /stop (?:emailing|contacting)/i,
      /do not (?:email|contact)/i,
      /don'?t (?:email|contact)/i,
    ])
  ) {
    return { classification: "unsubscribe", confidence: 0.92, reason: "Recipient asked to stop, unsubscribe, or expressed no interest." }
  }

  return null
}

function isNegativeReply(body: string): ClassificationResult | null {
  if (textIncludes(body, [/not interested/i, /not a fit/i, /no thanks/i, /pass on this/i])) {
    return { classification: "negative_reply", confidence: 0.9, reason: "Recipient declined this outreach without requesting a global opt-out." }
  }
  return null
}

function isWrongPerson(body: string): ClassificationResult | null {
  if (
    textIncludes(body, [
      /wrong person/i,
      /not (?:the )?right person/i,
      /no longer (?:work|with)/i,
      /doesn'?t work here/i,
      /try someone else/i,
      /reach out to .+ instead/i,
    ])
  ) {
    return { classification: "wrong_person", confidence: 0.88, reason: "Recipient indicated they are not the right contact." }
  }

  return null
}

function isChallenge(subject: string, body: string): ClassificationResult | null {
  const combined = `${subject}\n${body}`
  if (
    textIncludes(combined, [
      /verify (?:that )?you(?: are|'re)? human/i,
      /security challenge/i,
      /challenge response/i,
      /click.+(?:verify|confirm)/i,
      /prove (?:that )?you(?: are|'re)? not spam/i,
    ])
  ) {
    return { classification: "challenge", confidence: 0.84, reason: "Mailbox challenge or anti-spam verification detected." }
  }

  return null
}

async function classifyWithLlm(input: {
  subject: string
  body: string
}): Promise<ClassificationResult | null> {
  if (!process.env.OPENROUTER_API_KEY) return null

  try {
    return await withLlmRetries(log, async () => {
      const llmInput = JSON.stringify({ subject: input.subject, body: input.body.slice(0, 4000) })
      const systemInstructions =
        "Classify a matched inbound email reply to a backlink outreach email. Return only the requested JSON. Distinguish an explicit unsubscribe from a negative reply that only declines this pitch. Be conservative and use needs_review when uncertain."
      log.info("llm request", {
        model: OPENROUTER_MODELS.ANTHROPIC_CLAUDE_HAIKU_4_5,
        fallbackModels: [OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH],
        systemInstructions,
        input: llmInput,
      })
      const { text } = await generateText({
        model: OPENROUTER_MODELS.ANTHROPIC_CLAUDE_HAIKU_4_5,
        fallbackModels: [OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH],
        timeoutMs: 15_000,
        systemInstructions,
        input: llmInput,
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "inbound_email_classification",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                classification: {
                  type: "string",
                  enum: ["human_reply", "auto_reply", "bounce", "unsubscribe", "negative_reply", "wrong_person", "challenge", "needs_review"],
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                reason: { type: "string" },
              },
              required: ["classification", "confidence", "reason"],
            },
          },
        },
      })

      return parseLlmJson<ClassificationResult>(text)
    })
  } catch (err) {
    log.warn("classification failed", { error: String(err) })
    return null
  }
}

export async function classifyInboundEmail({
  headers,
  fromEmail,
  subject,
  textBody,
}: {
  headers: HeaderMap
  fromEmail: string | null
  subject: string
  textBody: string
}): Promise<ClassificationResult> {
  const cleanedBody = stripQuotedReply(textBody)
  const bodyForRules = cleanedBody || textBody

  const ruleResult =
    isBounce(headers, fromEmail, subject, textBody) ??
    isAutoReply(headers, subject, textBody) ??
    isUnsubscribe(bodyForRules) ??
    isNegativeReply(bodyForRules) ??
    isWrongPerson(bodyForRules) ??
    isChallenge(subject, bodyForRules)

  if (ruleResult) return ruleResult

  if (cleanedBody.length >= 3) {
    const llmResult = await classifyWithLlm({ subject, body: cleanedBody })
    if (llmResult && llmResult.confidence >= 0.75) return llmResult
    return { classification: "needs_review", confidence: 0.5, reason: "Message contains reply text but could not be classified confidently." }
  }

  return { classification: "needs_review", confidence: 0.5, reason: "Matched message did not contain enough reply text to classify safely." }
}
