import type { ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
}

/**
 * Bordered content block used to group a titled section. Radius and heading
 * style follow the cards in the design reference (`recipe-card.tsx`).
 */
export function Card({ title, children }: CardProps) {
  return (
    <section className="rounded-2xl border bg-card border-border p-4 tablet:p-6">
      <h2 className="font-serif text-xl font-bold">{title}</h2>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </section>
  )
}
