import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import type { CollectionDetail } from '../../services/collections'

interface CollectionDetailHeaderProps {
  collection: CollectionDetail
  onAddRecipes?: () => void
}

export function CollectionDetailHeader({ collection, onAddRecipes }: CollectionDetailHeaderProps) {
  const count = collection.recipes.length
  return (
    <header className="flex flex-col gap-6 tablet:flex-row tablet:items-center">
      <div
        className="h-32 w-32 shrink-0 overflow-hidden rounded-3xl shadow-lg"
        style={{ backgroundColor: collection.accentColor }}
      >
        {collection.coverImageUrl && (
          <img src={collection.coverImageUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="mb-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{ color: collection.accentColor }}
        >
          Collection
        </p>
        <h1 className="break-words font-serif text-3xl font-bold text-foreground tablet:text-4xl">
          {collection.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {count} {count === 1 ? 'recipe' : 'recipes'} · curated by you
        </p>
        <Button variant="primary" onClick={onAddRecipes} disabled={!onAddRecipes} className="mt-4">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add recipes
        </Button>
      </div>
    </header>
  )
}
