import { useNavigate } from 'react-router-dom'

interface RecipeFormActionsProps {
  submitting: boolean
}

/** Cancel (back to home) and the submit button, with its loading label. */
export function RecipeFormActions({ submitting }: RecipeFormActionsProps) {
  const navigate = useNavigate()

  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {submitting ? 'Publishing…' : 'Publish'}
      </button>
    </div>
  )
}
