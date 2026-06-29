---
version: alpha
name: Mentiohunt
description: A clean, modern light system for a founder-focused backlink prospecting product with confident contrast and warm orange emphasis.
colors:
  primary: "#FF5A1F"
  primary-60: "#FF8A5A"
  primary-20: "#FFE3D6"
  secondary: "#1F1F1F"
  tertiary: "#F5F5F5"
  neutral: "#FFFFFF"
  surface: "#FFFFFF"
  on-surface: "#1F1F1F"
  muted: "#6F6F6F"
  border: "#E7E7E7"
  success: "#2DBE60"
  warning: "#F4C84A"
  error: "#E24B4B"
typography:
  headline-display:
    fontFamily: Figtree
    fontSize: 56px
    fontWeight: 700
    lineHeight: 57.2px
    letterSpacing: -0.08em
  headline-lg:
    fontFamily: Figtree
    fontSize: 43px
    fontWeight: 400
    lineHeight: 52px
    letterSpacing: 0em
  headline-md:
    fontFamily: Figtree
    fontSize: 33px
    fontWeight: 400
    lineHeight: 40px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Figtree
    fontSize: 26px
    fontWeight: 400
    lineHeight: 40px
    letterSpacing: -0.05em
  body-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 20px
    fontWeight: 400
    lineHeight: 30px
    letterSpacing: -0.06em
  body-md:
    fontFamily: Bricolage Grotesque
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: -0.03em
  body-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: -0.02em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 500
    lineHeight: 14px
    letterSpacing: 0.02em
  nav-link:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0em
  pill:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 16px
  xl: 20px
  full: 9999px
spacing:
  xs: 6px
  sm: 16px
  md: 24px
  lg: 44px
  xl: 100px
  gutter: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: 12px 16px
    height: 40px
  button-primary-hover:
    backgroundColor: "#FF4800"
    textColor: "{colors.neutral}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    border: "1px solid {colors.border}"
    padding: 12px 16px
    height: 40px
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.none}"
    padding: 0px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    border: "1px solid {colors.border}"
    padding: 20px 20px 24px
  input:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  chip:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-surface}"
    typography: "{typography.pill}"
    rounded: "{rounded.full}"
    padding: 6px 12px
---

# Mentiohunt

## Overview

Mentiohunt presents a focused, founder-friendly B2B SaaS interface: clean, confident, and action-oriented without feeling like a generic dashboard. The layout centers the opportunity queue and outreach workflow, making the primary question — "What should I do next?" — immediately answerable. The emotional tone balances urgency and trust through crisp dark text, open white space, and a vivid orange accent that signals momentum and action.

The product is used by non-expert founders who need to run link building without managing it as a function. The interface should feel effortless, not powerful — closer to a well-curated inbox than an analytics platform.

## Colors

- **Primary (#FF5A1F):** Vivid orange — the brand's only hero accent. Used for CTAs, active states, score highlights, opportunity fit indicators, and any element that says "act on this." Never use blue or green as a primary call to action.
- **Secondary / On-surface (#1F1F1F):** Deep charcoal for body text, nav, and the primary button variant when orange is already dominant in context. Gives the interface a serious, professional backbone.
- **Tertiary (#F5F5F5):** Soft neutral surface for chips, tags, subtle groupings, and inactive states. Separates content without adding visual weight.
- **Neutral / Surface (#FFFFFF):** Dominant canvas color for the page, cards, and panels. Cards sit white on the off-white page — differentiated by border and shadow, not fill color.
- **Muted (#6F6F6F):** Supporting text, secondary labels, metadata, and de-emphasized copy. Never use for primary content.
- **Border (#E7E7E7):** Card edges, dividers, nav borders, and structural separation. 1px only — never heavy.
- **Success (#2DBE60):** Positive prospect states, confirmed placements, high-fit scores. Use sparingly.
- **Warning (#F4C84A):** Intermediate statuses, pending review, mid-range scores.
- **Error (#E24B4B):** Failed outreach, low-fit flags, destructive actions. Must remain visually distinct from the brand orange.

## Typography

Three distinct voices: Figtree for headlines, Bricolage Grotesque for body copy, and Inter for UI labels and navigation.

Headlines are bold and compact. The display style carries strong negative letter-spacing for hero statements on the landing page. Body text is friendly and legible — suited to rationale copy, opportunity descriptions, and instructional text. Labels are structured and tight for queue chrome, metadata, score badges, and nav items.

Uppercase is reserved for eyebrow labels only. All other copy is sentence case. Score and numeric values use tabular-nums with slightly heavier weight for scanability.

- **Headings:** `font-heading` (Figtree). `tracking-tight`, `text-balance`.
- **Body:** `font-sans` (Bricolage Grotesque). `leading-7`.
- **Labels / Nav / Badges:** `font-ui` (Inter).
- **Eyebrows:** `text-[0.7rem] tracking-[0.24em] uppercase font-bold` in `text-(--color-blaze-orange)`. Always paired with a thin divider: `mx-auto mt-3 h-px w-12 bg-blaze-orange/60`.

## Layout & Spacing

The app uses a centered, focused layout that keeps the opportunity queue front and center. Content is grouped in clear blocks with generous separation — the queue, the detail panel, and the outreach prep area each feel like distinct surfaces, not a collapsed grid.

Spacing follows a rhythm of 6px, 16px, 24px, 44px, and 100px. Cards use comfortable internal padding. Prefer wide gutters and breathing room over dense grids; the interface should feel like a well-organized workspace, not a data wall.

Empty states should teach users what inputs improve discovery quality — competitors, keywords, and article URLs are the primary levers.

## Elevation & Depth

Depth is restrained. Cards sit white on an off-white (#fcfcfc) page background, separated by a 1px border and `shadow-sm`. On hover, cards lift slightly with `shadow-md` and `-translate-y-0.5`. No heavy drop shadows, no dark card fills, no glossy effects.

Ambient warmth comes from orange blobs at `/7` opacity with `blur-[100px]` — background atmosphere only, never structural.

## Shapes

Rounded and approachable. Primary CTA buttons are `rounded-full`. Cards and panels use `rounded-2xl`. Score badges and status pills are `rounded-full`. No sharp corners on primary UI elements.

## Icons

Always Tabler icons (`@tabler/icons-react`). Never lucide-react, never inline SVGs, never other libraries. Stroke weight: default (1.5). Size: 20px in UI, 24px in empty states. Pair action-pointing icons with `text-(--color-blaze-orange)`; use muted for metadata and secondary indicators.

## Components

**Buttons**
- Primary CTA: solid `bg-(--color-blaze-orange)`, white text, `rounded-full`, hover → `--crimson-carrot`. Used for approve, send, and primary queue actions.
- Secondary: white + `border-border`, hover tint `bg-(--color-blaze-orange)/4`. Used for reject, skip, and secondary actions.
- Tertiary: plain text link, no container. Used for nav and inline secondary actions.

**Cards**
White `rounded-2xl`, 1px `border-border`, `shadow-sm`. High-fit opportunity cards carry a left accent bar in orange. Internal padding 20px/24px. Nested mini-cards for grouped metrics.

**Score Badges**
`rounded-full`, orange bg at `/8–/10` opacity, orange text. Always paired with plain-language rationale below — never a score alone.

**Status Pills**
`rounded-full`, muted bg, colored dot. For prospect status (pending, approved, sent, placed).

**Inputs**
White fill, `rounded-md`, minimal border. Quiet and aligned with the card system.

**Chips / Tags**
`rounded-full`, tertiary bg, Inter pill style. For topic tags, keyword labels, and fit categories.

**Empty States**
Single large Tabler icon (muted) + instructional copy that tells the user exactly what to add to improve results. No decorative illustrations.

## Eyebrow + Section Header Pattern

```tsx
<span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
  Eyebrow
</span>
<div className="mx-auto mt-3 h-px w-12 bg-blaze-orange/60" />
<h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
  Heading
</h2>
<p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
  Subtext
</p>
```

## Do's and Don'ts

- Do keep the interface spacious and focused on the queue — "what to do next" is the primary question.
- Do use orange for action signals, fit scores, and CTAs. Reserve it; don't spread it everywhere.
- Do pair every score or recommendation with plain-language reasoning.
- Do prefer `shadow-sm` + `border-border` for card depth over fill colors or heavy shadows.
- Don't use blue or green as a primary accent — links only for blue, secondary status only for green.
- Don't use gradient buttons — flat orange only.
- Don't use all-caps headings (eyebrows only).
- Don't build analytics-heavy dashboards or sidebars with 10+ nav items — this is a focused queue tool.
- Don't use emojis — use Tabler icons instead.
- Don't imply guaranteed backlink acquisition or present unverified contact data as verified.
