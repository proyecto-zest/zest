import { useState } from 'react'
import type {
  CollectionDifficulty,
  CollectionSearchField,
} from '../../services/collectionRecipeSearch'
import { CollectionRecipeSearchControls } from '../collections/CollectionRecipeSearchControls'
import { useCollectionRecipeSearch } from '../collections/useCollectionRecipeSearch'
import { PickerRecipeResults } from './PickerRecipeResults'
import { PickerScrollArea } from './PickerScrollArea'
import type { PickerSelection } from './types'

interface PickerRecipesTabProps {
  selection: PickerSelection
}

/** Every recipe on Zest (own and other users'), searchable by name or ingredient. */
export function PickerRecipesTab({ selection }: PickerRecipesTabProps) {
  const [field, setField] = useState<CollectionSearchField>('name')
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState<CollectionDifficulty>('')
  const [page, setPage] = useState(1)
  const search = useCollectionRecipeSearch({ field, query, difficulty, page })

  // Any filter change starts over from the first page of results.
  const withFirstPage =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value)
      setPage(1)
    }

  return (
    <>
      <CollectionRecipeSearchControls
        field={field}
        query={query}
        difficulty={difficulty}
        disabled={false}
        onFieldChange={withFirstPage(setField)}
        onQueryChange={withFirstPage(setQuery)}
        onDifficultyChange={withFirstPage(setDifficulty)}
      />
      <PickerScrollArea>
        <PickerRecipeResults
          {...search}
          query={query}
          difficulty={difficulty}
          page={page}
          onPageChange={setPage}
          selection={selection}
        />
      </PickerScrollArea>
    </>
  )
}
