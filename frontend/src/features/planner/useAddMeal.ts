import { useToast } from '../../components/ui/toast'
import { createPlannerEntry } from '../../services/planner'
import { formatPlannerDate } from './formatPlannerDate'
import type { PickedRecipe } from './types'

/**
 * Returns the picker's `onSelect`: saves one portion of the recipe on the day,
 * reloads the week and confirms with a toast. A failure is rethrown so the
 * picker can show the backend's message and stay open.
 */
export function useAddMeal(date: string, refetch: () => void) {
  const { showToast } = useToast()

  return async (recipe: PickedRecipe) => {
    await createPlannerEntry({ recipeId: recipe.id, date, quantity: 1 })
    refetch()
    showToast(`"${recipe.title}" was added to ${formatPlannerDate(date)}.`)
  }
}
