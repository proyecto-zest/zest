/** Loading placeholder for the recipe detail page, matching its final layout. */
export function RecipeDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <div className="grid gap-6 tablet:grid-cols-2">
        <div className="aspect-[4/3] animate-pulse rounded-3xl bg-muted" />
        <div className="flex flex-col justify-center gap-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-8 w-full animate-pulse rounded-full bg-muted" />
        </div>
      </div>
      <div className="grid gap-8 tablet:grid-cols-[minmax(0,340px)_1fr]">
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  )
}
