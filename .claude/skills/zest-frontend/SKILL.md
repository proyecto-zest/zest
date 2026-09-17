---
name: zest-frontend
description: Conventions and design system for the Zest frontend (React + TypeScript + Vite + Tailwind). Use before creating or changing any screen, component, hook, API call or style under frontend/. Also when picking colors, typography or spacing, or building new UI.
---

# Zest frontend

The rules live in the support repo (`support/` submodule). **Read them before
writing UI** — do not summarize them from memory.

## Always read
- `support/skills/frontend.md` — component conventions, structure, styling, API
  calls, auth, uploads.

## Read as the task requires
- `support/design/zest/Zest.dc.html` — interactive prototype covering every
  screen. Open it before building the equivalent screen and copy its layout,
  states and copy.
- `support/design/uploads/zest-wireframe-design/` — coded reference
  implementation (Next.js + Tailwind v4 + shadcn/ui). It is Next, not Vite: take
  the component breakdown and Tailwind classes, **not** the Next-only APIs
  (`next/image`, `next/link`, server components).
- `support/design/uploads/zest-wireframe-design/app/globals.css` — design tokens
  (Citrus palette, fonts, radii).
- `support/docs/db.md` — entity fields, for typing requests and responses.

## Non-negotiable
- The design is a spec, not a suggestion. If a screen or state (empty, error,
  loading) is not covered by either artifact, ask before improvising.
- Use the tokens (`bg-primary`, `text-foreground`), never one-off values
  (`bg-[#3a3a3a]`).
- TypeScript strict. Typed props, never `any`, no `@ts-ignore` without a
  documented reason.

## Known conflicts — ask, do not pick one alone
- Mobile nav: the prototype says the bottom tab bar was replaced by a top drawer,
  but the reference app still ships a working `components/bottom-nav.tsx`. The two
  design artifacts disagree.
- Recipe "tags" (Vegan, Gluten-free) show up as chips in the design, but
  `labels`/`recipe_labels` were dropped from the schema. Do not build a
  table-backed tags feature without confirming. See `zest-database`.
