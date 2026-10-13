import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import type { CollectionDetail } from '../../services/collections'
import type { CollectionRecipeCardData } from '../../types/recipe'
import { CollectionDetailHeader } from './CollectionDetailHeader'
import { CollectionActionDialog } from './CollectionActionDialog'
import { CollectionDetailSkeleton } from './CollectionDetailSkeleton'
import { CollectionRecipeGrid } from './CollectionRecipeGrid'
import { useCollectionDetail } from './useCollectionDetail'

interface CollectionDetailPageProps {
  /** Modal integration belongs to ZEST-95; call onChanged after successful additions. */
  onAddRecipes?: (collection: CollectionDetail, onChanged: () => void) => void
  /** Modal integration belongs to ZEST-96; call onChanged after successful membership changes. */
  onSaveRecipe?: (recipe: CollectionRecipeCardData, onChanged: () => void) => void
}

export function CollectionDetailPage(props: CollectionDetailPageProps) {
  const { id } = useParams()
  return <CollectionDetailContent key={id} id={id ?? ''} {...props} />
}

function CollectionDetailContent({
  id,
  onAddRecipes,
  onSaveRecipe,
}: CollectionDetailPageProps & { id: string }) {
  const { state, retry, refresh } = useCollectionDetail(id)
  const [dialog, setDialog] = useState<{
    title: 'Add to collection' | 'Save to collection'
    subtitle: string
  } | null>(null)
  return (
    <div className="flex flex-col gap-7">
      <Link
        to="/collections"
        className="inline-flex items-center gap-2 self-start text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        All collections
      </Link>

      {state.status === 'loading' && <CollectionDetailSkeleton />}
      {state.status === 'notFound' && (
        <p className="py-16 text-center text-lg font-semibold text-foreground">
          Collection not found
        </p>
      )}
      {state.status === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <Alert variant="error" title="Couldn't load this collection" message={state.message} />
          {state.retryable && (
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          )}
        </div>
      )}
      {state.status === 'ok' && (
        <>
          <CollectionDetailHeader
            collection={state.collection}
            onAddRecipes={() => {
              if (onAddRecipes) onAddRecipes(state.collection, refresh)
              else setDialog({ title: 'Add to collection', subtitle: state.collection.name })
            }}
          />
          <CollectionRecipeGrid
            recipes={state.collection.recipes}
            onSaveRecipe={(recipe) => {
              if (onSaveRecipe) onSaveRecipe(recipe, refresh)
              else setDialog({ title: 'Save to collection', subtitle: recipe.title })
            }}
          />
        </>
      )}
      {dialog && <CollectionActionDialog {...dialog} onClose={() => setDialog(null)} />}
    </div>
  )
}
