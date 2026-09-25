import { RecipeGridSkeleton } from '../feed/RecipeGrid'

/** Loading state matching the profile header, tabs and recipe grid. */
export function ProfilePageSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="h-28 animate-pulse bg-muted tablet:h-36" />
        <div className="px-6 pb-6">
          <div className="-mt-12 h-24 w-24 animate-pulse rounded-full border-4 border-card bg-muted" />
          <div className="mt-4 h-7 w-48 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="h-10 w-56 animate-pulse rounded bg-muted" />
      <RecipeGridSkeleton />
    </div>
  )
}
