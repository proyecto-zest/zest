import { useState } from 'react'
import { UserRound } from 'lucide-react'
import type { RecipeAuthorData } from '../../types/recipe'

interface AuthorAvatarProps {
  author: RecipeAuthorData | null
  size?: 'sm' | 'lg'
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  lg: 'h-10 w-10 text-sm',
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

/** Author avatar with initials when its URL is absent or cannot be loaded. */
export function AuthorAvatar({ author, size = 'sm' }: AuthorAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const avatarUrl = author?.avatarUrl ?? null

  const classes = `flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground ${sizeClasses[size]}`

  if (!author) {
    return (
      <span className={classes} aria-hidden="true">
        <UserRound className={size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
      </span>
    )
  }

  if (!avatarUrl || failedUrl === avatarUrl) {
    return (
      <span className={classes} aria-hidden="true">
        {initials(author.name) || '?'}
      </span>
    )
  }

  return (
    <span className={classes}>
      <img
        src={avatarUrl}
        alt=""
        onError={() => setFailedUrl(avatarUrl)}
        className="h-full w-full object-cover"
      />
    </span>
  )
}
