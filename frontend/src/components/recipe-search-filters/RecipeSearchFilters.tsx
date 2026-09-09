import { X } from 'lucide-react'
import type { Ingredient } from '../../features/recipe-create/types'
import { toOptions } from '../../lib/enumLabels'
import { IngredientFilterField } from './IngredientFilterField'
import { NameFilterField } from './NameFilterField'
import { SelectedIngredientChips } from './SelectedIngredientChips'
import { SingleSelectDropdown } from './SingleSelectDropdown'
import { hasActiveFilters, type RecipeSearchFiltersValue } from './types'

interface VisibleFilters {
  name?: boolean
  ingredient?: boolean
  category?: boolean
  difficulty?: boolean
}

interface RecipeSearchFiltersProps {
  value: RecipeSearchFiltersValue
  onChange: (value: RecipeSearchFiltersValue) => void
  categories: string[]
  difficulties: string[]
  ingredients: Ingredient[]
  /** Any filter left out (or set `false`) here doesn't render. Defaults to showing all four. */
  visible?: VisibleFilters
}

/**
 * Controlled group of the four recipe filters (name, ingredients, category,
 * difficulty). Holds no state of its own and never touches the router —
 * `value`/`onChange` are the only source of truth, so any parent (the feed
 * today, a future "browse by ingredient" screen tomorrow) can drive it and
 * decide what to do with the result, including how it maps to the URL.
 *
 * @example
 * const [filters, setFilters] = useState(emptyRecipeSearchFilters)
 * <RecipeSearchFilters
 *   value={filters}
 *   onChange={setFilters}
 *   categories={metadata.categories}
 *   difficulties={metadata.difficulties}
 *   ingredients={ingredients}
 * />
 *
 * @example Hiding a filter that doesn't apply to a given screen
 * <RecipeSearchFilters {...props} visible={{ difficulty: false }} />
 */
export function RecipeSearchFilters({
  value,
  onChange,
  categories,
  difficulties,
  ingredients,
  visible,
}: RecipeSearchFiltersProps) {
  const showName = visible?.name ?? true
  const showIngredient = visible?.ingredient ?? true
  const showCategory = visible?.category ?? true
  const showDifficulty = visible?.difficulty ?? true

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 tablet:flex-row tablet:flex-wrap tablet:items-start">
        {showName && <NameFilterField value={value.name} onChange={(name) => onChange({ ...value, name })} />}

        {showIngredient && (
          <IngredientFilterField
            ingredients={ingredients}
            value={value.ingredientIds}
            onChange={(ingredientIds) => onChange({ ...value, ingredientIds })}
          />
        )}

        {showCategory && (
          <SingleSelectDropdown
            aria-label="Filter by category"
            placeholder="Any category"
            value={value.category}
            onChange={(category) => onChange({ ...value, category })}
            options={[{ value: '', label: 'Any category' }, ...toOptions(categories)]}
          />
        )}

        {showDifficulty && (
          <SingleSelectDropdown
            aria-label="Filter by difficulty"
            placeholder="Any difficulty"
            value={value.difficulty}
            onChange={(difficulty) => onChange({ ...value, difficulty })}
            options={[{ value: '', label: 'Any difficulty' }, ...toOptions(difficulties)]}
          />
        )}

        {hasActiveFilters(value) && (
          <button
            type="button"
            onClick={() => onChange({ name: '', ingredientIds: [], category: '', difficulty: '' })}
            className="inline-flex items-center gap-1 self-start rounded-lg px-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>

      {showIngredient && (
        <SelectedIngredientChips
          ingredients={ingredients}
          value={value.ingredientIds}
          onChange={(ingredientIds) => onChange({ ...value, ingredientIds })}
        />
      )}
    </div>
  )
}
