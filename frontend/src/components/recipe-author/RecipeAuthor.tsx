import { Link } from 'react-router-dom'
import type { RecipeAuthorData } from '../../types/recipe'
import { AuthorAvatar } from './AuthorAvatar'

interface RecipeAuthorProps {
  author: RecipeAuthorData | null
  variant?: 'card' | 'detail'
}

/** Shared author presentation for recipe cards and recipe detail. */
export function RecipeAuthor({ author, variant = 'card' }: RecipeAuthorProps) {
  const name = author?.name || 'Unknown author'
  const classes =
    variant === 'detail'
      ? 'flex min-w-0 items-center gap-3'
      : 'relative z-20 mt-auto inline-flex w-fit max-w-full min-w-0 self-start items-center gap-2 pt-1 text-sm text-muted-foreground'
  const content = (
    <>
      <AuthorAvatar author={author} size={variant === 'detail' ? 'lg' : 'sm'} />
      {variant === 'detail' ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
          <span className="block text-xs text-muted-foreground">Recipe author</span>
        </span>
      ) : (
        <span className="truncate">{name}</span>
      )}
    </>
  )

  if (!author) return <div className={classes}>{content}</div>

  return (
    <Link
      to={`/profile/${author.id}`}
      className={`${classes} rounded-lg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50`}
    >
      {content}
    </Link>
  )
}
