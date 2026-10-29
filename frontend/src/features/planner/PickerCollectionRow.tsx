import type { CollectionSummary } from '../../services/collections'
import { PickerRow } from './PickerRow'

interface PickerCollectionRowProps {
  collection: CollectionSummary
  onOpen: () => void
}

export function PickerCollectionRow({ collection, onOpen }: PickerCollectionRowProps) {
  const { name, recipeCount, accentColor, coverImageUrl } = collection
  return (
    <PickerRow
      title={name}
      subtitle={`${recipeCount} ${recipeCount === 1 ? 'recipe' : 'recipes'}`}
      thumbnail={
        <span className="block h-full w-full" style={{ backgroundColor: accentColor }}>
          {coverImageUrl && (
            <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
          )}
        </span>
      }
      action="open"
      aria-label={`Open ${name}`}
      onClick={onOpen}
    />
  )
}
