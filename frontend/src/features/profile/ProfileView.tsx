import type { ReactNode } from 'react'
import type { PublicUserData } from '../../types/user'
import { ProfileHeader } from './ProfileHeader'

interface ProfileViewProps {
  user: PublicUserData
  children: ReactNode
}

/** The same profile layout serves the own and read-only public pages. */
export function ProfileView({ user, children }: ProfileViewProps) {
  return (
    <div className="flex flex-col gap-8">
      <ProfileHeader user={user} />
      <section className="flex flex-col gap-5">{children}</section>
    </div>
  )
}
