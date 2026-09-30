import { BookMarked } from 'lucide-react'

/** Reserved profile tab; collection behavior belongs to its own ticket. */
export function CollectionsPlaceholder() {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <BookMarked aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
      <h2 className="mt-3 font-serif text-xl font-bold text-foreground">Collections</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your saved recipe collections will appear here.
      </p>
    </div>
  )
}
