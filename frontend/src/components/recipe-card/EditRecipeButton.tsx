import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'

interface EditRecipeButtonProps {
  recipeId: string
}

/**
 * Edit entry point for a `RecipeCard`. The card's detail link is a separate
 * overlay, so this button can be focused and activated independently.
 */
export function EditRecipeButton({ recipeId }: EditRecipeButtonProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      aria-label="Edit recipe"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        navigate(`/recipes/${recipeId}/edit`)
      }}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-md transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Pencil aria-hidden="true" className="h-3 w-3" />
    </button>
  )
}
