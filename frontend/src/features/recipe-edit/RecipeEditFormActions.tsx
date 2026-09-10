import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

interface RecipeEditFormActionsProps {
  recipeId: string
  submitting: boolean
}

/** Cancel (back to the recipe's detail page) and the submit button, with its loading label. */
export function RecipeEditFormActions({ recipeId, submitting }: RecipeEditFormActionsProps) {
  const navigate = useNavigate()

  return (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={() => navigate(`/recipes/${recipeId}`)}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}
