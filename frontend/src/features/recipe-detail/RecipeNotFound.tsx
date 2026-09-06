import { Link } from 'react-router-dom'

/** Shown when GET /recipes/:id responds 404 — an unknown or deleted recipe. */
export function RecipeNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg font-semibold text-foreground">Recipe not found</p>
      <p className="text-sm text-muted-foreground">This recipe may have been removed.</p>
      <Link to="/" className="text-sm font-medium text-primary">
        ← Back to feed
      </Link>
    </div>
  )
}
