import { useState } from 'react'
import { UserRound } from 'lucide-react'

interface ProfileAvatarProps {
  name: string
  avatarUrl: string | null
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

/** Read-only profile avatar with initials when the image is missing or broken. */
export function ProfileAvatar({ name, avatarUrl }: ProfileAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (!avatarUrl || failedUrl === avatarUrl) {
    return (
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-card bg-secondary font-serif text-2xl font-bold text-secondary-foreground">
        {initials(name) || <UserRound aria-hidden="true" className="h-8 w-8" />}
      </div>
    )
  }

  return (
    <img
      src={avatarUrl}
      alt={`${name}'s avatar`}
      onError={() => setFailedUrl(avatarUrl)}
      className="h-24 w-24 shrink-0 rounded-full border-4 border-card object-cover"
    />
  )
}
