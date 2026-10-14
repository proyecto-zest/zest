import type { CurrentUserData } from '../../types/user'
import { ProfileAvatar } from './ProfileAvatar'

interface ProfileHeaderProps {
  user: Pick<CurrentUserData, 'name' | 'avatarUrl'>
}

/** Shared profile identity block; ZEST-66 can reuse it for public profiles. */
export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="h-28 bg-gradient-to-r from-primary via-ring to-accent tablet:h-36" />
      <div className="px-6 pb-6">
        <div className="-mt-12">
          <ProfileAvatar name={user.name} avatarUrl={user.avatarUrl} />
        </div>
        <h1 className="mt-4 break-words font-serif text-2xl font-bold text-foreground">
          {user.name}
        </h1>
      </div>
    </section>
  )
}
