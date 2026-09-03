import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

interface RecipeFormActionsProps {
  submitting: boolean
}

/** Cancel (back to home) and the submit button, with its loading label. */
export function RecipeFormActions({ submitting }: RecipeFormActionsProps) {
  const navigate = useNavigate()

  return (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={() => navigate('/')}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={submitting}>
        {submitting ? 'Publishing…' : 'Publish'}
      </Button>
    </div>
  )
}
