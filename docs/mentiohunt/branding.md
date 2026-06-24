---
version: alpha
name: VedaAI Academic Intelligence
description: A clean, modern light system for an AI-first academic product with confident contrast and warm orange emphasis.
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
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.lg}"
    padding: 12px 16px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
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

# VedaAI Academic Intelligence

## Overview

VedaAI presents a polished, approachable B2B education brand: modern, confident, and academically credible without feeling cold. The layout is spacious and centered, with a strong editorial hero followed by dashboard-style product visuals, which suggests a product aimed at school leaders, teachers, and institutional buyers. The emotional tone balances trust and energy through crisp black text, soft grays, and a vivid orange accent.

## Colors

- **Primary (#FF5A1F):** A vivid orange used as the brand’s energetic highlight for key words, progress indicators, and attention-grabbing UI states. It signals optimism, action, and product momentum.
- **Secondary (#1F1F1F):** A deep charcoal used for body text, navigation, and the primary call-to-action. It gives the interface a serious, professional backbone.
- **Tertiary (#F5F5F5):** A soft neutral layer used for subtle surfaces, chips, and low-contrast groupings. It helps separate content without adding visual weight.
- **Neutral / Surface (#FFFFFF):** The dominant canvas color for the page, cards, and panels. The system relies on white space to make the interface feel bright and uncluttered.
- **Muted (#6F6F6F):** Supporting text and secondary labels should use this calmer gray to reduce emphasis while maintaining readability.
- **Border (#E7E7E7):** Fine divider and outline color for cards, the nav bar, and soft structural separation. It keeps hierarchy clear without heavy rules.
- **Success (#2DBE60):** Used sparingly for positive academic metrics and progress states, such as performance summaries.
- **Warning (#F4C84A):** Useful for intermediate alerts, highlights, and subtle status cues in analytics.
- **Error (#E24B4B):** Reserved for critical states, low scores, or destructive actions; it should remain visually distinct from the warm brand orange.

## Typography

The system uses three distinct voices: Figtree for large headlines, Bricolage Grotesque for body copy, and Inter for UI labels and navigation. Headlines are bold and compact, with the largest display style carrying the most negative letter-spacing to create a strong, product-led landing page statement. Body text is friendly and legible, while labels are tighter and more structured for dashboard chrome, navigation, and metadata.

Uppercase styling is not dominant; instead, the system relies on weight, size, and spacing to create hierarchy. Short pill labels and badges should stay concise and can use slightly stronger weight for clarity, but the overall voice remains sentence case and readable.

## Layout & Spacing

The page uses a centered, fixed-width hero composition with generous vertical breathing room. Content is grouped in large blocks with ample separation, and the product mockup sits below the hero copy as the primary visual anchor. Spacing follows a simple rhythm based on 6px, 16px, 24px, 44px, and 100px increments, which creates a calm progression from tight internal control to spacious section breaks.

Cards and dashboard panels use comfortable internal padding rather than dense grids. The overall structure feels modular and dashboard-oriented, with rounded containers nested inside larger panels to imply hierarchy without clutter. Use wide margins and generous gutters so the interface preserves the airy, premium feel seen in the screenshot.

## Elevation & Depth

Depth is restrained and mostly achieved through soft shadows, contrast, and layered containers rather than strong extrusion. The page background stays bright, while cards and the top CTA use subtle shadow to separate themselves from the canvas. The hero badge, cards, and button all feel lightly lifted, but the design avoids heavy drop shadows or glossy effects.

Flat surfaces dominate, especially in the dashboard panels, where tonal separation and light borders do most of the work. Use shadow sparingly and only where you need to indicate clickability or surface elevation.

## Shapes

The shape language is rounded and friendly, with a clear preference for medium to large corner radii. Primary buttons feel pill-like, cards use a more substantial rounded rectangle, and badges/chips are fully rounded for soft emphasis. Overall, the system reads as approachable and modern rather than sharp or technical.

## Components

Buttons should be compact, confident, and easy to scan. `button-primary` uses the charcoal fill with white text, rounded large corners, and a 40px height for the main CTA. `button-secondary` is more restrained with a white background and outlined treatment, suitable for less prominent actions. `button-tertiary` should appear as a plain text link with no visible container, used for navigation or secondary inline actions. Keep padding balanced at 12px 16px so buttons feel solid without becoming bulky.

Cards use `card` as the foundational surface style: white background, subtle shadow, and 20px/24px internal spacing. They should contain dashboard summaries, lists, and content blocks with clear internal hierarchy. Prefer nested mini-cards or tiles inside larger cards when presenting metrics, because the source design often frames groups of KPIs this way.

Inputs should be simple and quiet: white fill, soft radius, and minimal border treatment. They should prioritize legibility and feel aligned with the card system rather than introducing a separate visual language. Use them in forms, search fields, or filter controls with the same calm spacing as cards.

Chips and badges should use the warm tertiary surface and rounded-full shape, with small uppercase-free text. They are ideal for status tags, labels, and compact announcements like the “Incubated at IIM Bangalore” pill.

Navigation links should use the `nav-link` style: medium weight, small size, dark text, and no decorative chrome. The active or primary destination can be reinforced through proximity or weight rather than heavy underline treatment.

## Do's and Don'ts

- Do keep the interface spacious and centered, with strong hero hierarchy and generous whitespace.
- Do use the charcoal primary text color for most copy and reserve orange for emphasis, highlights, and key metrics.
- Do maintain soft rounding across cards, buttons, and chips so the UI stays approachable.
- Do prefer light surfaces and subtle shadows over heavy borders or dramatic elevation.
- Don't introduce saturated accent colors beyond the established orange, green, yellow, and error red roles.
- Don't make body text too dense or too small; the system relies on readability and breathing room.
- Don't use sharp corners or hard-edged panels for primary UI elements.
- Don't overcomplicate component states; keep hover and active treatments minimal and consistent.
