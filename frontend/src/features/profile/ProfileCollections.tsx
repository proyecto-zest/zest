import { BookMarked } from 'lucide-react'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import { CollectionCard } from '../collections/CollectionCard'
import { useCollections } from '../collections/useCollections'

/** Only mounted on the own profile. GET /collections resolves ownership from the token. */
export function ProfileCollections() {
  const { state, retry } = useCollections()

  if (state.status === 'loading') {
    return (
      <div
        role="status"
        aria-label="Loading your collections"
        className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="aspect-square animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert variant="error" title="Couldn't load your collections" message={state.message} />
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      </div>
    )
  }
  if (state.collections.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <BookMarked aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 font-serif text-xl font-bold text-foreground">No collections yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your collections will appear here.</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-4">
      {state.collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  )
}
