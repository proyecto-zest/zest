/**
 * Responsive breakpoints — the only ones used across the project.
 *
 * These live in TypeScript rather than as CSS variables because `var()` is not
 * allowed inside a media query condition, so Tailwind cannot build responsive
 * variants from custom properties. This file is their single source: the
 * Tailwind theme reads it, and so should any JS that needs to match a viewport.
 *
 * Mobile is the base, unprefixed state — mobile-first, so there is no `mobile:`
 * variant to forget.
 */
export const breakpoints = {
  /** Tablets and large phones in landscape. */
  tablet: '768px',
  /** Laptops and desktops. */
  desktop: '1024px',
} as const

export type Breakpoint = keyof typeof breakpoints
