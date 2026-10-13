import { RecipeCardSkeleton } from '../../components/recipe-card'

export function CollectionDetailSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-label="Loading collection">
      <div className="flex flex-col gap-6 tablet:flex-row tablet:items-center" aria-hidden="true">
        <div className="h-32 w-32 shrink-0 animate-pulse rounded-3xl bg-muted" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-11 w-32 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,228px),1fr))] gap-5">
        {Array.from({ length: 4 }, (_, index) => (
          <RecipeCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
