import type { RecipeAuthorData } from '../../types/recipe'
import { AuthorAvatar } from './AuthorAvatar'

interface RecipeAuthorProps {
  author: RecipeAuthorData | null
  variant?: 'card' | 'detail'
}

/** Shared author presentation for recipe cards and recipe detail. */
export function RecipeAuthor({ author, variant = 'card' }: RecipeAuthorProps) {
  const name = author?.name || 'Unknown author'

  if (variant === 'detail') {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <AuthorAvatar author={author} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">Recipe author</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-auto flex min-w-0 items-center gap-2 pt-1 text-sm text-muted-foreground">
      <AuthorAvatar author={author} />
      <span className="truncate">{name}</span>
    </div>
  )
}
