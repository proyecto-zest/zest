import { CollectionRecipeSearchControls } from '../collections/CollectionRecipeSearchControls'
import { useCollectionRecipeSearch } from '../collections/useCollectionRecipeSearch'
import { PickerRecipeResults } from './PickerRecipeResults'
import type { PickedRecipe, PickerSearch } from './types'

interface PickerRecipesTabProps {
  search: PickerSearch
  onSearchChange: (search: PickerSearch) => void
  onSelect: (recipe: PickedRecipe) => void
}

/** Every recipe on Zest (own and other users'), searchable by name or ingredient. */
export function PickerRecipesTab({ search, onSearchChange, onSelect }: PickerRecipesTabProps) {
  const results = useCollectionRecipeSearch(search)

  // Any filter change starts over from the first page of results.
  const change = (patch: Partial<PickerSearch>) => onSearchChange({ ...search, ...patch, page: 1 })

  return (
    <>
      <CollectionRecipeSearchControls
        field={search.field}
        query={search.query}
        difficulty={search.difficulty}
        disabled={false}
        onFieldChange={(field) => change({ field })}
        onQueryChange={(query) => change({ query })}
        onDifficultyChange={(difficulty) => change({ difficulty })}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-6 pb-6 pt-4">
        <PickerRecipeResults
          {...results}
          query={search.query}
          difficulty={search.difficulty}
          page={search.page}
          onPageChange={(page) => onSearchChange({ ...search, page })}
          onSelect={onSelect}
        />
      </div>
    </>
  )
}
