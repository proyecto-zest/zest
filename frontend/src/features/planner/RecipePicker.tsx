import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { PickerCollectionsTab } from './PickerCollectionsTab'
import { PickerHeader } from './PickerHeader'
import { PickerRecipesTab } from './PickerRecipesTab'
import { PickerTabs, type PickerTab } from './PickerTabs'
import type { PickedRecipe, PickerSearch } from './types'

interface RecipePickerProps {
  /** Planner day being filled, as `YYYY-MM-DD`. */
  date: string
  /** Receives the chosen recipe; the picker closes itself right after. */
  onSelect: (recipe: PickedRecipe) => void
  onClose: () => void
}

/** "Add a meal" dialog: pick any recipe on Zest or one from the user's collections. */
export function RecipePicker({ date, onSelect, onClose }: RecipePickerProps) {
  const [tab, setTab] = useState<PickerTab>('recipes')
  // Kept here, not in the tabs: a tab unmounts when you leave it, taking its state along.
  const [search, setSearch] = useState<PickerSearch>({
    field: 'name',
    query: '',
    difficulty: '',
    page: 1,
  })
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null)

  const select = (recipe: PickedRecipe) => {
    onSelect(recipe)
    onClose()
  }

  return (
    <Modal labelledBy="recipe-picker-title" onClose={onClose} size="lg">
      <div className="flex max-h-[84vh] flex-col overflow-hidden rounded-3xl bg-background shadow-lg">
        <PickerHeader titleId="recipe-picker-title" date={date} onClose={onClose} />
        <PickerTabs active={tab} onChange={setTab} />
        {tab === 'recipes' ? (
          <PickerRecipesTab search={search} onSearchChange={setSearch} onSelect={select} />
        ) : (
          <PickerCollectionsTab
            openId={openCollectionId}
            onOpenChange={setOpenCollectionId}
            onSelect={select}
          />
        )}
      </div>
    </Modal>
  )
}
