import { useState } from 'react'
import { X } from 'lucide-react'
import type { Ingredient } from '../../features/recipe-create/types'
import { toOptions } from '../../lib/enumLabels'
import { IngredientFilterField } from './IngredientFilterField'
import { RecipeSearchField, type SearchField } from './RecipeSearchField'
import { SelectedIngredientChips } from './SelectedIngredientChips'
import { SingleSelectDropdown } from './SingleSelectDropdown'
import { emptyRecipeSearchFilters, hasActiveFilters, type RecipeSearchFiltersValue } from './types'

interface VisibleFilters {
  name?: boolean
  author?: boolean
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
  /** Any filter left out (or set `false`) here doesn't render. Defaults to showing all five. */
  visible?: VisibleFilters
}

/**
 * Controlled group of the five recipe filters (name, author, ingredients,
 * category, difficulty). Holds no state of its own and never touches the router —
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
  const showAuthor = visible?.author ?? true
  const showIngredient = visible?.ingredient ?? true
  const showCategory = visible?.category ?? true
  const showDifficulty = visible?.difficulty ?? true
  const [searchField, setSearchField] = useState<SearchField>(() => value.author ? 'author' : 'name')
  const availableFields: SearchField[] = [
    ...(showName ? ['name' as const] : []),
    ...(showAuthor ? ['author' as const] : []),
  ]
  const activeSearchField = availableFields.includes(searchField) ? searchField : availableFields[0]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 tablet:flex-row tablet:flex-wrap tablet:items-start">
        {activeSearchField && (
          <RecipeSearchField
            key={activeSearchField}
            field={activeSearchField}
            onFieldChange={setSearchField}
            availableFields={availableFields}
            value={value[activeSearchField]}
            onChange={(text) => onChange({ ...value, [activeSearchField]: text })}
          />
        )}

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
      </div>

      {(value.name.trim() || value.author.trim()) && (
        <div className="flex flex-wrap gap-2">
          {value.name.trim() && (
            <button
              type="button"
              aria-label="Clear recipe name filter"
              onClick={() => onChange({ ...value, name: '' })}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
            >
              Recipe: {value.name}
              <X aria-hidden="true" className="h-3 w-3" />
            </button>
          )}
          {value.author.trim() && (
            <button
              type="button"
              aria-label="Clear author filter"
              onClick={() => onChange({ ...value, author: '' })}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
            >
              Author: {value.author}
              <X aria-hidden="true" className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {hasActiveFilters(value) && (
        <button
          type="button"
          onClick={() => onChange(emptyRecipeSearchFilters)}
          className="inline-flex items-center gap-1 self-start rounded-lg bg-card px-2 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
        >
          Clear filters
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      )}

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
