---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
metadata:
  author: OpenCode
  version: "0.1.0"
---

# Frontend Design

Use this skill when building or improving frontend UI.

## First Step

Before proposing a design direction or writing code, read both of these files:

1. `packages/ui/src/styles/globals.css` — source of truth for design tokens, semantic color variables, inline theme exports, and the available Tailwind utilities.
2. `DESIGN.md` — authoritative brand spec for Mentiohunt: colors, typography, spacing, shape language, component patterns, and do/don'ts. Always defer to DESIGN.md for brand decisions.

Treat `packages/ui/src/styles/globals.css` as the source of truth for:
- the current design tokens
- the available semantic color variables
- the inline theme exports available to Tailwind utilities
- the brand palette, which is orange-led

When the interface needs warm accents, highlights, gradients, borders, charts, glows, or emphasis colors, prefer the orange variables already defined there such as:
- `--crimson-carrot`
- `--blaze-orange`
- `--blaze-orange-2`
- `--pumpkin-spice`
- `--harvest-orange`
- `--princeton-orange`
- `--deep-saffron`
- `--amber-glow`
- `--orange`
- `--amber-flame`

The same palette is also exposed through inline theme color tokens for utility usage:
- `--color-crimson-carrot`
- `--color-blaze-orange`
- `--color-blaze-orange-2`
- `--color-pumpkin-spice`
- `--color-harvest-orange`
- `--color-princeton-orange`
- `--color-deep-saffron`
- `--color-amber-glow`
- `--color-orange`
- `--color-amber-flame`

Also respect the semantic tokens from that file like `--background`, `--foreground`, `--primary`, `--accent`, `--border`, and the radius scale, along with their inline theme equivalents like `--color-background`, `--color-foreground`, `--color-primary`, and `--color-accent`.

Prefer the inline theme color tokens when working through Tailwind utilities, and the base variables when writing custom CSS. Do not invent a disconnected palette when the existing tokens already support the design.

## Goal

Create distinctive, production-grade frontend interfaces with high design quality. Avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user may ask for a component, page, application, or interface to build, with context about purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a bold aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme and execute it intentionally: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, or another clear design language.
- **Constraints**: Respect framework, accessibility, responsiveness, and performance requirements.
- **Differentiation**: Decide what will make the interface memorable.

Critical rule: choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work. Intentionality matters more than intensity.

## Implementation Standards

Build interfaces that are:
- production-grade and functional
- visually striking and memorable
- cohesive, with a clear point of view
- refined in spacing, states, typography, and composition
- responsive on desktop and mobile
- accessible in contrast, semantics, focus states, and motion preferences

## Aesthetic Guidelines

### Typography

- Choose fonts with character.
- Avoid generic defaults like Arial, Roboto, Inter, and plain system stacks unless the existing product already depends on them for a deliberate reason.
- Prefer pairing a distinctive display face with a refined, readable body face.

### Color and Theme

- Start from the tokens in `packages/ui/src/styles/globals.css`.
- Use the inline theme exports for utility-driven styling and the base CSS variables for custom CSS.
- Use CSS variables and semantic tokens instead of hardcoded one-off colors when possible.
- Let the orange palette lead accents, emphasis, and brand energy.
- Use dominant colors and crisp accents instead of timid, evenly spread palettes.

### Motion

- Use animation intentionally.
- Prefer one or two high-impact sequences over scattered decorative motion.
- Favor CSS-first motion when sufficient.
- In React codebases, use the project-standard motion library when present.
- Include meaningful hover, focus, enter, and scroll-reveal states when they support the concept.

### Spatial Composition

- Avoid default template layouts.
- Use asymmetry, overlap, rhythm shifts, strong negative space, or deliberate density when they fit the concept.
- Break the grid on purpose, not by accident.

### Backgrounds and Details

- Create atmosphere beyond flat fills.
- Consider textures, gradients, meshes, linework, patterns, translucency, grain, or sharp shadow systems that fit the visual language.
- Decorative details should support the concept, not distract from it.

## Anti-Patterns

Never default to:
- purple-on-white startup gradients
- interchangeable hero sections and pricing cards
- cookie-cutter shadcn layouts with no design point of view
- repetitive font choices across unrelated designs
- safe but forgettable spacing and composition

Do not converge on the same aesthetic every time. Vary light and dark themes, typography, layout structure, and visual language according to the task.

## Working Style

When using this skill:

1. Read `packages/ui/src/styles/globals.css` first.
2. Identify the palette and semantic tokens you should preserve or extend.
3. Decide on a strong design direction that fits the product context.
4. Implement the UI directly in code.
5. Refine details: typography, spacing, hierarchy, states, responsiveness, and motion.
6. Verify the result works in the actual codebase.

## Repo-Specific Notes

- This repository uses a shared UI package and design tokens, so prefer alignment with existing tokens over isolated hardcoded styling.
- Preserve the product's orange brand energy unless the task clearly requires a different secondary treatment.
- When working inside an existing screen or design system, match its structure and interaction patterns while still raising the design quality.

## Mentiohunt Brand Guidelines

### Color

Orange is the only primary brand color — never use blue or green as hero. Secondary roles only.

| Intent | Token |
|---|---|
| Primary CTA, active states, accents | `--blaze-orange` |
| Ambient blobs, hover tints | `--princeton-orange` |
| Page / card backgrounds | `--background` (#fcfcfc) |
| Body text | `--foreground` |
| Labels, subtitles | `--muted-foreground` |
| Card edges, dividers | `--border` |

### Typography

See `DESIGN.md` for the full type scale. Summary:

- **Headings:** `font-heading` (Figtree). `tracking-tight`, `text-balance`.
- **Body:** `font-sans` (Bricolage Grotesque). `leading-7`.
- **Labels / Nav / Badges:** `font-ui` (Inter).
- **Eyebrows:** `text-[0.7rem] tracking-[0.24em] uppercase font-bold` in `text-(--color-blaze-orange)`. Always paired with a thin divider: `mx-auto mt-3 h-px w-12 bg-blaze-orange/60`.
- **Score / numeric values:** tabular-nums, slightly heavier weight.

### Shape Language

- Card radius: `rounded-2xl`. Badge / pill radius: `rounded-full`.
- Shadows: `shadow-sm` default, `shadow-md` on hover — never deep.
- Card borders: 1px `border-border`, always visible, never heavy.
- Cards sit white on off-white page — differentiated by border + shadow, not fill color.

### Icons

- **Always Tabler icons** (`@tabler/icons-react`). Never lucide-react, never inline SVGs, never other libraries.
- Stroke weight: default (1.5). Size: 20px in UI, 24px in empty states.
- Pair with `text-(--color-blaze-orange)` for action-pointing icons; muted for metadata.

### Motion

- Card hover: `hover:-translate-y-0.5 hover:shadow-md transition-all`.
- Transitions: `duration-150 ease-out` — snappy, not floaty.
- Background blobs: `blur-[100px]` orange at `/7` opacity — ambient warmth only.

### Component Defaults

| Component | Pattern |
|---|---|
| Primary CTA button | Solid `bg-(--color-blaze-orange)`, white text, `rounded-full`, hover → `--crimson-carrot` |
| Secondary button | White + `border-border`, hover tint `bg-(--color-blaze-orange)/4` |
| Score badges | `rounded-full`, orange bg at `/8–/10` opacity, orange text |
| Opportunity cards | White `rounded-2xl`, left accent bar in orange for high-fit |
| Empty states | Single Tabler icon (large, muted) + instructional copy |
| Status pills | `rounded-full`, muted bg, colored dot |

### Eyebrow + Section Header Pattern

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

### What to Avoid

- Blue as primary — links only
- Gradient buttons — flat orange only
- Heavy drop shadows or dark card backgrounds
- All-caps headings (eyebrows only)
- Generic dashboard chrome (sidebars with 10+ nav items, dense analytics grids)
- Emojis in UI — use Tabler icons instead

## Output Expectation

The final UI should feel deliberately designed for the product and context, not generated from a generic pattern library prompt.
