import { useCollections } from '../collections/useCollections'
import { PickerCollectionRecipes } from './PickerCollectionRecipes'
import { PickerCollectionRow } from './PickerCollectionRow'
import { ListStatus, PickerEmptyText } from '../../components/ListStatus'
import type { PickerSelection } from './types'

interface PickerCollectionsTabProps {
  /** Collection being browsed, or `null` while the list of collections shows. */
  openId: string | null
  onOpenChange: (id: string | null) => void
  selection: PickerSelection
}

/** The user's collections; tapping one shows its recipes inside the picker. */
export function PickerCollectionsTab({
  openId,
  onOpenChange,
  selection,
}: PickerCollectionsTabProps) {
  const { state, retry } = useCollections()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-6 pb-6 pt-4">
      {openId ? (
        <PickerCollectionRecipes
          id={openId}
          onBack={() => onOpenChange(null)}
          selection={selection}
        />
      ) : (
        <>
          {state.status === 'loading' && <ListStatus status="loading" label="collections" />}
          {state.status === 'error' && (
            <ListStatus
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
