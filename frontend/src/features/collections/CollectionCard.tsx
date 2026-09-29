import { Heart, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CollectionSummary } from '../../services/collections'

interface CollectionCardProps {
  collection: CollectionSummary
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg">
      {collection.coverImageUrl && (
        <img
          src={collection.coverImageUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
      <Link
        to={`/collections/${collection.id}`}
        aria-label={`Open ${collection.name}`}
        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4">
        <h2 className="break-words font-serif text-lg font-bold text-background">
          {collection.name}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-background/90">
          <Heart
            aria-hidden="true"
            className="h-4 w-4"
            style={{ color: collection.accentColor }}
            fill="currentColor"
          />
          {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
        </p>
      </div>
      {/* The delete action belongs to a later ticket; keep the control visible but inert for now. */}
      <button
        type="button"
        aria-label={`Delete collection ${collection.name}`}
        title="Delete collection"
        disabled
        className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/55 text-background backdrop-blur"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}
