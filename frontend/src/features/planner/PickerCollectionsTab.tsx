import { useState } from 'react'
import { useCollections } from '../collections/useCollections'
import { PickerCollectionRecipes } from './PickerCollectionRecipes'
import { PickerCollectionRow } from './PickerCollectionRow'
import { PickerEmptyText } from './PickerEmptyText'
import { PickerListStatus } from './PickerListStatus'
import { PickerScrollArea } from './PickerScrollArea'
import type { PickerSelection } from './types'

interface PickerCollectionsTabProps {
  selection: PickerSelection
}

/** The user's collections; tapping one shows its recipes inside the picker. */
export function PickerCollectionsTab({ selection }: PickerCollectionsTabProps) {
  const { state, retry } = useCollections()
  const [openId, setOpenId] = useState<string | null>(null)

  if (openId) {
    return (
      <PickerScrollArea>
        <PickerCollectionRecipes id={openId} onBack={() => setOpenId(null)} selection={selection} />
      </PickerScrollArea>
    )
  }

  return (
    <PickerScrollArea>
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
            onOpen={() => setOpenId(collection.id)}
          />
        ))}
    </PickerScrollArea>
  )
}
