import type { useCollectionRecipeSearch } from '../collections/useCollectionRecipeSearch'
import { Pagination } from '../feed/Pagination'
import { PickerEmptyText } from './PickerEmptyText'
import { PickerListStatus } from './PickerListStatus'
import { PickerRecipeRow } from './PickerRecipeRow'
import type { PickerSelection } from './types'

type PickerRecipeResultsProps = ReturnType<typeof useCollectionRecipeSearch> & {
  query: string
  difficulty: string
  page: number
  onPageChange: (page: number) => void
  selection: PickerSelection
}

export function PickerRecipeResults({
  state,
  retry,
  query,
  difficulty,
  page,
  onPageChange,
  selection,
}: PickerRecipeResultsProps) {
  if (state.status === 'loading') return <PickerListStatus status="loading" label="recipes" />
  if (state.status === 'error') {
    return (
      <PickerListStatus
        status="error"
        label="recipes"
        message={state.message}
        onRetry={state.retryable ? retry : undefined}
      />
    )
  }

  const { recipes, pagination } = state.data
  if (recipes.length === 0) {
    const text = query.trim()
    if (text) return <PickerEmptyText>{`No recipes match "${text}".`}</PickerEmptyText>
    if (difficulty) return <PickerEmptyText>No recipes match this difficulty.</PickerEmptyText>
    return <PickerEmptyText>No recipes available.</PickerEmptyText>
  }

  return (
    <>
      {recipes.map(({ imageUrls, ...recipe }) => (
        <PickerRecipeRow
          key={recipe.id}
          recipe={{ ...recipe, imageUrl: imageUrls[0] ?? null }}
          selection={selection}
        />
      ))}
      <Pagination page={page} totalPages={pagination.totalPages} onPageChange={onPageChange} />
    </>
  )
}
