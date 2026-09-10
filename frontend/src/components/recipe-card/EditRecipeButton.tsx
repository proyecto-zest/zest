import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'

interface EditRecipeButtonProps {
  recipeId: string
}

/**
 * Edit entry point for a `RecipeCard`. A plain `<Link>` would nest inside the
 * card's own `<Link>` (invalid HTML, unpredictable navigation), so this is a
 * button that navigates programmatically and stops the click from also
 * triggering the card's own navigation to the detail page.
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
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur transition-colors hover:bg-background"
    >
      <Pencil aria-hidden="true" className="h-3 w-3" />
    </button>
  )
}
