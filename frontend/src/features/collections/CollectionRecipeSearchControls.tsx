import { Search } from 'lucide-react'
import { SingleSelectDropdown } from '../../components/recipe-search-filters/SingleSelectDropdown'
import { enumLabel } from '../../lib/enumLabels'
import type {
  CollectionDifficulty,
  CollectionSearchField,
} from '../../services/collectionRecipeSearch'

interface CollectionRecipeSearchControlsProps {
  field: CollectionSearchField
  query: string
  difficulty: CollectionDifficulty
  disabled: boolean
  onFieldChange: (field: CollectionSearchField) => void
  onQueryChange: (query: string) => void
  onDifficultyChange: (difficulty: CollectionDifficulty) => void
}

const difficulties: CollectionDifficulty[] = ['', 'FACIL', 'MEDIA', 'DIFICIL']

export function CollectionRecipeSearchControls({
  field,
  query,
  difficulty,
  disabled,
  onFieldChange,
  onQueryChange,
  onDifficultyChange,
}: CollectionRecipeSearchControlsProps) {
  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-2 px-6 pt-4">
      <div className="flex h-11 min-w-0 items-center rounded-full border border-input bg-card px-4 focus-within:ring-2 focus-within:ring-ring/50">
        <Search aria-hidden="true" className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <SingleSelectDropdown
          aria-label="Search by"
          placeholder="Name"
          value={field}
          onChange={(value) => onFieldChange(value as CollectionSearchField)}
          options={[
            { value: 'name', label: 'Name' },
            { value: 'ingredient', label: 'Ingredient' },
          ]}
          triggerClassName="flex shrink-0 items-center gap-2 rounded-full bg-transparent py-2 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <span aria-hidden="true" className="mx-3 h-5 w-px shrink-0 bg-border" />
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search…"
          aria-label="Search recipes"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">Difficulty:</span>
        {difficulties.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={difficulty === value}
            onClick={() => onDifficultyChange(value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${difficulty === value ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60'}`}
          >
            {value ? enumLabel(value) : 'All'}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
