---
name: support-inbox
description: Review Mentiohunt's primary support inbox (nicolas@mentiohunt.com, Zoho Mail) and draft or send replies to customer support emails. Use whenever the user asks to check support emails, check the inbox, see what customers are asking, reply to a support email, answer a customer, triage support requests, or catch up on nicolas@mentiohunt.com. Also trigger for vaguer prompts like "anything in the inbox" or "customer waiting on a reply" when talking about Mentiohunt support. Connects over IMAP to read and SMTP to send — never write a draft or send a reply without the user's explicit go-ahead first, even if they only asked you to "read and help me answer."
---

# Support Inbox

Mentiohunt's support inbox is a real Zoho Mail account (`nicolas@mentiohunt.com`), reachable over
plain IMAP/SMTP. Credentials live in `credentials.env` next to this file — never print its
contents, never paste the password into a message, commit, or any output the user didn't ask for.
That file is gitignored; keep it that way.

## What this skill is for

Read the inbox, understand what each customer is asking, and figure out what a good reply would
say. **Never write the actual draft, and never send, without the user's explicit permission
first** — even a request like "read this thread and help me answer" only authorizes reading.
Summarize what you'd say and ask before putting a draft together; ask again before sending it.

Remember who Mentiohunt is talking to: founders of B2B SaaS companies doing their own backlink
outreach. Replies should sound like they come from the product team, not a generic support bot —
direct, specific, no corporate hedging.

## Ground truth for answering questions

Before answering a support question, make sure the answer matches how the product actually works.
Two sources, in order of authority:

1. **Product behavior** — `/Users/nahuelmoreno/Documents/projects/mentions/CLAUDE.md` has the core
   model: user provides a sitemap/article URLs, the system auto-fetches daily, finds prospect
   sites, drafts outreach, and **auto-sends outreach on discovery** — the customer's job is to
   monitor and cancel bad-fit opportunities, not approve each one before it sends. Once a prospect
   replies, automation stops and the founder takes the conversation over personally from their own
   connected mailbox, not Mentiohunt's shared sending pool. Get this distinction right — customers
   often ask "will you email people without me checking first" and the honest answer is yes, that's
   the product, but they can cancel opportunities any time before send.
2. **Ticket/account data** — if the question is about a specific customer's account, check
   `packages/supabase/database-types.ts` for the relevant tables (prospects, sequences, outreach
   status, etc.) and query Supabase via the `supabase` MCP tools if you need live data to answer
   accurately (e.g. "why didn't my campaign send" needs to look at that customer's actual prospect
   records, not a guess).

If a question needs a decision only the founder would make (refunds, pricing exceptions, custom
scope), don't answer — flag it in the draft and let the user decide.

## Workflow

1. **List the inbox** to see what's there:
   ```bash
   python3 .claude/skills/support-inbox/scripts/list_inbox.py --unseen-only --limit 20
   ```
   Drop `--unseen-only` to see everything, not just unread. Each line is one JSON message with a
   `uid`, sender, subject, date, and a short snippet — enough to triage without opening every one.

2. **Read the full message** for anything that needs a real answer:
   ```bash
   python3 .claude/skills/support-inbox/scripts/read_message.py <uid>
   ```
   This also prints the `Message-ID`, which you need for threading the reply.

3. **Ask before drafting.** Tell the user what the reply would need to cover and get their go-ahead
   before writing it — don't produce draft text on your own initiative, even when asked to "read
   and help me answer." Once they say go ahead, write it the way the founder would write it —
   short, concrete, answers the actual question first. Don't overexplain internal mechanics unless
   the customer asked about them. No em dashes — use a period, comma, or parentheses instead.

4. **Show the draft to the user and get explicit approval before sending**, every time — no
   exceptions for a message that "clearly" needs a certain reply. Support inbound is low-volume and
   every reply is customer-facing correspondence sent from a real person's mailbox — treat it like
   you would any other outbound message you can't unsend.

5. **Send** only after that approval:
   ```bash
   python3 .claude/skills/support-inbox/scripts/send_reply.py \
     --to customer@example.com \
     --subject "Re: their subject" \
     --body-file /path/to/drafted_body.txt \
     --in-reply-to "<message-id-from-step-2>"
   ```
   Write the body to a scratch file first (avoids shell-quoting problems with multi-line text).
   Use `--dry-run` to print the exact message instead of sending, if you want to double-check
   formatting first.

## Notes

- These scripts are stdlib-only (`imaplib`/`smtplib`/`email`) — no extra Python packages needed.
- IMAP fetch marks messages as read implicitly in some clients; that's expected here since the
  point is triaging real inbound.
- If a login fails, the most likely cause is Zoho requiring an app-specific password instead of
  the account password — tell the user rather than retrying blindly.
