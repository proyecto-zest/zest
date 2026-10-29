import { useCollections } from '../collections/useCollections'
import { PickerCollectionRecipes } from './PickerCollectionRecipes'
import { PickerCollectionRow } from './PickerCollectionRow'
import { PickerEmptyText, PickerListStatus } from './PickerListStatus'
import type { PickedRecipe } from './types'

interface PickerCollectionsTabProps {
  /** Collection being browsed, or `null` while the list of collections shows. */
  openId: string | null
  onOpenChange: (id: string | null) => void
  onSelect: (recipe: PickedRecipe) => void
}

/** The user's collections; tapping one shows its recipes inside the picker. */
export function PickerCollectionsTab({
  openId,
  onOpenChange,
  onSelect,
}: PickerCollectionsTabProps) {
  const { state, retry } = useCollections()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-6 pb-6 pt-4">
      {openId ? (
        <PickerCollectionRecipes
          id={openId}
          onBack={() => onOpenChange(null)}
          onSelect={onSelect}
        />
      ) : (
        <>
          {state.status === 'loading' && <PickerListStatus status="loading" label="collections" />}
          {state.status === 'error' && (
            <PickerListStatus
              status="error"
              label="collections"
              message={state.message}
              onRetry={retry}
            />
          )}
          {state.status === 'ok' && state.collections.length === 0 && (
            <PickerEmptyText>You have no collections yet.</PickerEmptyText>
          )}
          {state.status === 'ok' &&
            state.collections.map((collection) => (
              <PickerCollectionRow
                key={collection.id}
                collection={collection}
                onOpen={() => onOpenChange(collection.id)}
              />
            ))}
        </>
      )}
    </div>
  )
}
