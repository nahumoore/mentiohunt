---
version: alpha
name: mentions
description: AI-first social media trend analysis and narrative intelligence brand with a minimal, spacious, black-and-white-led interface and soft blue product previews.
colors:
  primary: "#161617"
  secondary: "#151515"
  tertiary: "#f8f8f8"
  neutral: "#e5e7eb"
  surface: "#ffffff"
  on-surface: "#151515"
  background: "#f8f8f8"
  text: "#151515"
  accent: "#000000"
  error: "#d92d20"
typography:
  fontFamily: "General Sans, Inter, sans-serif"
  headline-display:
    fontFamily: "General Sans, sans-serif"
    fontSize: "60px"
    fontWeight: 700
    lineHeight: 72px
    letterSpacing: "0px"
  headline-lg:
    fontFamily: "General Sans, sans-serif"
    fontSize: "42px"
    fontWeight: 500
    lineHeight: 56.4px
    letterSpacing: "-0.03px"
  headline-md:
    fontFamily: "General Sans, sans-serif"
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 56.4px
    letterSpacing: "-3px"
  body-lg:
    fontFamily: "General Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 23px
    letterSpacing: "-0.3px"
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: "21px"
    fontWeight: 500
    lineHeight: 28.8px
    letterSpacing: "-1px"
  body-sm:
    fontFamily: "sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0px"
  label-lg:
    fontFamily: "sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0px"
  label-md:
    fontFamily: "sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0px"
  label-sm:
    fontFamily: "sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0px"
rounded:
  none: "0px"
  sm: "8px"
  md: "16px"
  lg: "500px"
  xl: "500px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "48px"
  lg: "64px"
  xl: "120px"
components:
  button:
    primary:
      backgroundColor: "{colors.primary}"
      color: "#ffffff"
      borderColor: "transparent"
      borderRadius: "{rounded.full}"
      borderWidth: "1px"
      borderStyle: "solid"
      padding: "11px 20px"
      fontSize: "12px"
      fontWeight: 400
      minWidth: "113px"
      minHeight: "40px"
      textDecoration: "none"
      boxShadow: "none"
    secondary:
      backgroundColor: "transparent"
      color: "{colors.text}"
      borderColor: "{colors.text}"
      borderRadius: "{rounded.full}"
      borderWidth: "1px"
      borderStyle: "solid"
      padding: "11px 20px"
      fontSize: "12px"
      fontWeight: 400
      minWidth: "113px"
      minHeight: "40px"
      textDecoration: "none"
      boxShadow: "none"
    link:
      backgroundColor: "transparent"
      color: "{colors.text}"
      borderColor: "transparent"
      borderRadius: "{rounded.none}"
      borderWidth: "0px"
      borderStyle: "none"
      padding: "0px"
      fontSize: "12px"
      fontWeight: 500
      minWidth: "0px"
      minHeight: "0px"
      textDecoration: "none"
      boxShadow: "none"
  card:
    backgroundColor: "{colors.tertiary}"
    borderColor: "{colors.neutral}"
    borderRadius: "{rounded.sm}"
    borderWidth: "1px"
    borderStyle: "solid"
    padding: "{spacing.sm}"
    boxShadow: "none"
    textColor: "{colors.text}"
---

# Overview

mentions is a restrained, high-contrast SaaS landing experience focused on credibility, clarity, and speed. The visual language is minimal: white or near-white surfaces, black primary actions, generous whitespace, and soft blue product imagery. The tone reads confident and analytical rather than playful.

Primary patterns observed in the homepage:

- Large centered hero headline with short supporting copy and one dominant CTA.
- Top navigation with simple text links plus two pill buttons.
- Product screenshot/preview presented in a large rounded container.
- Feature and testimonial sections with concise, utility-oriented messaging.

# Colors

Use a mostly monochrome system anchored by black text and buttons on an off-white background.

- `colors.primary` is the main action color for filled buttons and dark emphasis.
- `colors.secondary` and `colors.on-surface` are the main text color.
- `colors.background` and `colors.tertiary` support the light page and cards.
- `colors.neutral` is used for borders and subtle separators.
- `colors.surface` should stay white for content panels.
- `colors.error` is not visible in the source, so it is a conservative semantic fallback.

Recommended usage:

- Page background: `colors.background`
- Body text: `colors.text`
- Strong labels and nav links: `colors.secondary`
- Primary CTA: `colors.primary`
- Secondary CTA: transparent with dark border/text
- Dividers, card borders, input chrome: `colors.neutral`

# Typography

Typography is compact, modern, and editorial, with heavy reliance on General Sans and selective Inter usage.

## Token mapping

- `headline-display`: hero headline style used for the main statement.
- `headline-lg`: section titles and large marketing headings.
- `headline-md`: smaller display-style headings or emphasized feature headlines.
- `body-lg`: supporting body copy, feature descriptions, and testimonial text.
- `body-md`: alternate emphasized body style; appears closer to UI-sized prose.
- `body-sm`, `label-lg`, `label-md`, `label-sm`: small navigation, button, and meta text styles.

## Guidance

- Keep headlines tight and centered when used in hero contexts.
- Use negative or near-zero tracking sparingly; the UI relies more on size and weight than on decorative spacing.
- Avoid long paragraphs. The brand favors short, scannable copy blocks.

# Layout

The layout is spacious and vertically stacked.

- Content is centered within a wide desktop canvas.
- The hero leaves substantial breathing room above and below the headline.
- Navigation sits in a single horizontal row with logo left, links right.
- CTAs are grouped tightly and aligned to the rhythm of the nav.
- Product previews and feature content use large rounded containers and ample outer margins.

Spacing tokens:

- `spacing.xs`: 8px for tight icon/text gaps and small badge spacing.
- `spacing.sm`: 16px for card padding and compact section elements.
- `spacing.md`: 48px for major section separation.
- `spacing.lg`: 64px for large vertical breaks.
- `spacing.xl`: 120px for hero-to-content and section-to-section breathing room.

# Elevation & Depth

Depth is intentionally minimal.

- Shadows are effectively absent across the system.
- Separation comes from whitespace, borders, and rounded containers rather than elevation.
- Use subtle borders for cards, panels, and nav buttons.
- Product demo containers may rely on contrast in background tone instead of shadow.

# Shapes

Shapes are soft and highly rounded in interactive elements, with restrained radius in cards.

- `rounded.none`: sharp edges for structural elements.
- `rounded.sm`: 8px for cards and small panels.
- `rounded.md`: reserved if a slightly softer panel is needed.
- `rounded.lg` / `rounded.xl` / `rounded.full`: pill-style controls and CTAs.

Observed shape behavior:

- Buttons are fully pill-shaped.
- Cards are modestly rounded, not heavily shadowed.
- The product preview frame is very soft and spacious.

# Components

## Button

Use the existing button variants consistently.

- `button.primary`: filled black pill button for main conversion actions such as “Try for free.”
- `button.secondary`: outlined pill button for secondary actions such as “Log in.”
- `button.link`: text-only utility action for top navigation or inline links.

Implementation notes:

- Keep button labels short, usually 1–3 words.
- Maintain the compact height and padding from the tokens.
- Do not introduce filled accent buttons in other colors.

## Card

Use cards for testimonial snippets, feature blocks, and report samples.

- Light surface, subtle gray border, no shadow.
- Padding should remain compact and content-first.
- Keep card text left-aligned unless the surrounding section is explicitly centered.

## Navigation

Navigation is minimal and text-led.

- Logo left, links right.
- Primary account actions should be pill buttons.
- Use small label-size text and avoid icon-heavy nav treatments.

## Hero

The hero should follow the observed pattern.

- Center the headline.
- Place credibility badges or partner chips above the headline if needed.
- Use one primary CTA below the supporting line.
- Avoid extra decorative copy or secondary messages competing with the main claim.

## Product preview

The product preview is an important trust-building component.

- Present it inside a large rounded frame.
- Use a pale blue or soft tinted background when demonstrating the product.
- Keep the preview visually quiet so the interface itself remains the focus.

# Do's and Don'ts

## Do

- Do keep the interface sparse and highly readable.
- Do use black or near-black for primary emphasis.
- Do center the hero content and keep the copy short.
- Do rely on whitespace and borders instead of shadows.
- Do use pill buttons for the main actions.
- Do keep cards and panels light, subtle, and low-contrast.
- Do prefer General Sans for brand-facing marketing text.

## Don't

- Don't add bright accent colors or gradients as primary brand signals.
- Don't use heavy shadows, glassmorphism, or noisy backgrounds.
- Don't write long-form marketing paragraphs in the hero or feature sections.
- Don't over-round cards; reserve full rounding for buttons and chips.
- Don't make the UI feel consumer-playful; it should remain analytical and confident.
- Don't mix many font families without a clear hierarchy.
- Don't introduce complex navigation patterns when simple text links are sufficient.
