# Design system

Every color, type size, spacing step, radius and shadow in the app comes from a
token. Changing a token's value changes the whole app; nothing is hardcoded in a
component.

## Where the tokens live

| File | Holds |
|---|---|
| `frontend/src/styles/tokens.css` | Entry point — import this, never the parts |
| `frontend/src/styles/tokens/colors.css` | Citrus ramp and the semantic color roles |
| `frontend/src/styles/tokens/colors-dark.css` | Dark theme role overrides |
| `frontend/src/styles/tokens/typography.css` | Families, sizes, line heights, weights |
| `frontend/src/styles/tokens/layout.css` | Spacing unit, radii, shadows |
| `frontend/src/theme/breakpoints.ts` | Responsive breakpoints |
| `frontend/src/theme/*.ts` | Maps the tokens onto Tailwind's theme |

`tailwind.config.ts` **replaces** Tailwind's scales rather than extending them, so
a utility can only resolve to a token. `bg-slate-500` does not exist here.

## Colors

Named by role, never by value. Components use the role; only the role definitions
touch the Citrus ramp.

| Role | Use |
|---|---|
| `background` / `foreground` | Page canvas and its default text |
| `card` / `card-foreground` | Raised surfaces |
| `muted` / `muted-foreground` | Subdued fills and secondary text |
| `secondary` / `secondary-foreground` | Quiet fills, inactive chips |
| `primary` / `primary-foreground` | Main calls to action |
| `accent` / `accent-foreground` | Highlights |
| `border`, `input`, `ring` | Lines and focus rings |
| `error` / `success` (+ `-foreground`, `-surface`, `-border`) | Feedback |

Values are stored as RGB channels so opacity modifiers work: `bg-primary/10`,
`ring-ring/30`.

> **Pending design sign-off.** The design artifacts define no error or success
> color, and their `--destructive` is identical to `--primary`, which would make
> an error state indistinguishable from the main CTA. `success` reuses the Citrus
> lime; `error` is a deeper red picked to read as danger. Both need confirming
> before they show up in user-facing states.

## Typography

`font-heading` (Playfair Display) for headings and the wordmark, `font-sans`
(Geist) for body copy, `font-mono` (Geist Mono) for numeric or tabular text.
Fonts are self-hosted through Fontsource — nothing is fetched from a CDN.

Sizes run `2xs` through `5xl`, each carrying its own line height. `2xs` (11px)
exists because the design reaches for that size in badges and meta text.

## Spacing, radii, shadows

Spacing derives from a single `--space-unit` (0.25rem), so every step stays a
multiple of it and the rhythm is retuned in one place. Radii derive from
`--radius` (0.75rem); `rounded-full` is the pill used for buttons, avatars and
badges. Shadows are `sm`, `md`, `lg` — the design only uses `lg` today.

## Breakpoints

Mobile is the base, unprefixed state. There are exactly two prefixes:

| Prefix | Width |
|---|---|
| `tablet:` | 768px |
| `desktop:` | 1024px |

These live in TypeScript, not CSS, because `var()` is not allowed inside a media
query condition — Tailwind cannot build responsive variants from a custom
property. It is the one token that is not a CSS variable.

## No arbitrary values

`bg-[#e8415a]`, `text-[13px]` and `p-[7px]` are rejected by ESLint. They bypass
the theme, so changing a token stops reaching them.

**When the token you need does not exist, add it** — do not reach for an
arbitrary value. Put it in the matching file under `styles/tokens/`, map it in
`theme/`, and say why in the PR. If it feels like a one-off, that is usually a
sign the design needs a decision rather than the code needing an escape hatch.

Still allowed, because no token could express them: layout one-offs
(`grid-cols-[80px_repeat(7,1fr)]`), aspect ratios (`aspect-[4/3]`), and anything
wrapping `var()`, `env()` or `calc()` such as
`pb-[env(safe-area-inset-bottom)]`.

## Dark mode

The dark palette is defined but no toggle ships yet. Whoever builds it adds a
`dark` class on `<html>`; the roles handle the rest.
