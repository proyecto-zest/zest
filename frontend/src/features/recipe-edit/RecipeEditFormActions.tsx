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
      {/* `replace`: swaps the `/edit` history entry so Back from the detail
          page goes to where the user was before editing, not back here. */}
      <Button variant="secondary" onClick={() => navigate(`/recipes/${recipeId}`, { replace: true })}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}
