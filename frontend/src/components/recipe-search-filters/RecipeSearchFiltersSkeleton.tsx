/** Same shape/height as `RecipeSearchFilters`, shown while its data (categories, ingredients) is still loading — reserves the space so the grid below doesn't jump once the real filters mount. */
export function RecipeSearchFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-3 tablet:flex-row tablet:flex-wrap tablet:items-start" aria-hidden="true">
      <div className="h-11 flex-1 animate-pulse rounded-lg bg-muted tablet:max-w-xs" />
      <div className="h-11 w-32 animate-pulse rounded-lg bg-muted" />
      <div className="h-11 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-11 w-40 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}
