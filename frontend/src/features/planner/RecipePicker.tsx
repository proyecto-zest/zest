import { useState } from 'react'
import { Alert } from '../../components/alert'
import { Modal } from '../../components/ui/Modal'
import { PickerCollectionsTab } from './PickerCollectionsTab'
import { PickerHeader } from './PickerHeader'
import { PickerRecipesTab } from './PickerRecipesTab'
import { PickerTabs, type PickerTab } from './PickerTabs'
import type { PickedRecipe, PickerSearch } from './types'
import { usePickerSave } from './usePickerSave'

interface RecipePickerProps {
  /** Planner day being filled, as `YYYY-MM-DD`. */
  date: string
  /** Saves the chosen recipe. The picker closes when it resolves and shows the error if it rejects. */
  onSelect: (recipe: PickedRecipe) => Promise<void>
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
  const { selection, error, saving } = usePickerSave(onSelect, onClose)

  // Closing mid-save would hide the result of a request that is still running.
  const close = () => {
    if (!saving) onClose()
  }

  return (
    <Modal labelledBy="recipe-picker-title" onClose={close} size="lg">
      <div className="flex max-h-[84vh] flex-col overflow-hidden rounded-3xl bg-background shadow-lg">
        <PickerHeader titleId="recipe-picker-title" date={date} onClose={close} />
        <PickerTabs active={tab} onChange={setTab} />
        {error && (
          <div className="px-6 pt-4">
            <Alert variant="error" title="Couldn't add the meal" message={error} />
          </div>
        )}
        {tab === 'recipes' ? (
          <PickerRecipesTab search={search} onSearchChange={setSearch} selection={selection} />
        ) : (
          <PickerCollectionsTab
            openId={openCollectionId}
            onOpenChange={setOpenCollectionId}
            selection={selection}
          />
        )}
      </div>
    </Modal>
  )
}
