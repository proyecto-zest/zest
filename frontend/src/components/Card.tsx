import type { ReactNode } from 'react'

interface CardProps {
  /** Omit for sections that don't show a heading (e.g. a bare fields group). */
  title?: string
  children: ReactNode
}

/**
 * Bordered content block used to group a section. Radius follows the cards in
 * the design reference (`recipe-card.tsx`). Unlike the heading, content isn't
 * forced to a muted/small style — callers (forms, plain text) style their own.
 */
export function Card({ title, children }: CardProps) {
  return (
    // `min-w-0`: `Card` sometimes sits directly in a grid/flex row (e.g. the
    // ingredients/steps columns on the recipe detail page) — without it, a
    // grid/flex item defaults to its content's natural width, which lets long
    // unbroken text inside push the card (and the page) wider than its track
    // instead of wrapping.
    <section className="min-w-0 rounded-2xl border bg-card border-border p-4 tablet:p-6">
      {title && <h2 className="font-serif text-xl font-bold">{title}</h2>}
      <div className={title ? 'mt-4' : undefined}>{children}</div>
    </section>
  )
}
