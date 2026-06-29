# Mentiohunt — TODO / Future Planning

## Email connection + autopilot outreach (post-onboarding)

**Goal:** after signup + onboarding, user connects email account (SMTP send / IMAP read). Mentiohunt runs full outreach in autopilot; founder only acts at decision points.

**Validation (Reddit, r/SEO + r/linkbuilding):** strongly validated.
- Reply management = #1 time sink ("a whole morning", "4 hours per backlink"). Practitioners already split workflow: bulk/automate everything, then one human step = "answer to positive replies."
- Domain fear real and additive — founders avoid outreach partly to not burn their main domain.
- NO signal = **trust, not control.** "100% who promised real outreach resold marketplace links." Founder doesn't want to work every reply — wants to trust it's real + see what happened. Audit trail is load-bearing.

### What to build
- **SMTP/IMAP connect flow** — customer's own mailbox sends + receives. Real founder reply-to, transparent.
- **Reply ingestion + classifier** — IMAP polls replies, classifies them. Engine invisible for *action*.
- **Surface replies as opportunity status** — fold into existing opportunity card, not a mailbox UI.
- **Transparency / audit log (read-only)** — founder can see every email sent + every reply received, on demand. NOT an operational inbox they work — a record they can inspect. This is a trust feature, load-bearing per validation. "Here's exactly what happened with every email."

### Reply routing
**Auto-handle (no founder):**
- Silence → auto-filter / follow-up timing
- Not interested → canned decline, close
- "Send details/article" → autopilot sends prepared draft
- Agrees to plain editorial placement → move to placement
- OOO / wrong person / bounce → reroute or close

**Escalate to founder (decision card in queue, one click):**
- **Asks for money (paid placement) — THE primary escalation.** Every judgment-call signal in validation collapses to one moment: site replies with a price. Always surface, non-negotiable.
- Secondary: link swap / reciprocal, positive review / testimonial ask, custom terms (sponsored tag, nofollow demand, content edits)

Pattern: autopilot runs the ~80% mechanical back-and-forth; founder pinged only for judgment calls (mostly = money). Founder never works a mailbox.

### Open decision — paid-link boundary (lock before building classifier)
- **Editorial-only** (lean here for v1): paid request → auto-decline/flag. Cleanest, avoids FATJOE-style marketplace look.
- **Paid allowed, founder funds**: becomes part-marketplace. Revenue + Google paid-link risk.
- **Hybrid**: earned by default, paid opt-in per opportunity with budget cap. (likely v2)

### Guardrails (customer's domain reputation at stake)
- Send caps per day
- Founder approves first send per site (optional)
- Warmup considerations

### Positioning guardrail
Keep "approve or reject, not manage outreach." Do NOT build a generic inbox / outreach workstation — conflicts with differentiation doc (avoid: "more mailboxes," "cold email automation," "another outreach workstation"). Audit log = read-only trust record, not an operational inbox — stays on-positioning.

**Positioning line (from validation):** "You approve the money calls. We handle everything else — and you can see every email we sent."

### Next step
- Lock paid-link stance for v1
- Then sketch data model: `email_accounts`, `threads`, reply classification → opportunity status
