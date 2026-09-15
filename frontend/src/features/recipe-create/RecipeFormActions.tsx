import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

interface RecipeFormActionsProps {
  submitting: boolean
  /** Submitting, but still on the image upload — worth saying so, it's the slow part. */
  uploading?: boolean
}

/** Cancel (back to home) and the submit button, with its loading label. */
export function RecipeFormActions({ submitting, uploading }: RecipeFormActionsProps) {
  const navigate = useNavigate()

  return (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={() => navigate('/')}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={submitting}>
        {uploading ? 'Uploading image…' : submitting ? 'Publishing…' : 'Publish'}
      </Button>
    </div>
  )
}
