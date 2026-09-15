import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

interface RecipeEditFormActionsProps {
  recipeId: string
  submitting: boolean
  /** True while the form has any invalid field — blocks saving before the request fires. */
  disabled: boolean
  /** Submitting, but still on the image upload — worth saying so, it's the slow part. */
  uploading?: boolean
}

/** Cancel (back to the recipe's detail page) and the submit button, with its loading label. */
export function RecipeEditFormActions({ recipeId, submitting, disabled, uploading }: RecipeEditFormActionsProps) {
  const navigate = useNavigate()

  return (
    <div className="flex justify-end gap-3">
      {/* `replace`: swaps the `/edit` history entry so Back from the detail
          page goes to where the user was before editing, not back here. */}
      <Button variant="secondary" onClick={() => navigate(`/recipes/${recipeId}`, { replace: true })}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={submitting || disabled}>
        {uploading ? 'Uploading image…' : submitting ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}
