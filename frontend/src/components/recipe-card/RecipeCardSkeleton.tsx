import { recipeCardShellClasses } from './recipeCardVariants'

/**
 * Loading placeholder for `RecipeCard` — same shell (see `recipeCardVariants`),
 * so the grid doesn't reflow once real data arrives.
 */
export function RecipeCardSkeleton() {
  return (
    <div className={recipeCardShellClasses} aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex gap-1.5">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
