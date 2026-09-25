import { useState, type ReactNode } from 'react'
import { Alert } from '../../components/alert'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { CollectionsPlaceholder } from './CollectionsPlaceholder'
import { ProfileHeader } from './ProfileHeader'
import { ProfilePageSkeleton } from './ProfilePageSkeleton'
import { ProfileRecipes } from './ProfileRecipes'
import { ProfileSettings } from './ProfileSettings'
import { ProfileTabs, type ProfileTab } from './ProfileTabs'

/** The authenticated user's profile at `/profile`. */
export function ProfilePage() {
  const { user, auth0Sub, loading, error, replaceUser } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<ProfileTab>('recipes')

  if (loading) return <ProfilePageSkeleton />

  if (error || !user) {
    return (
      <Alert
        variant="error"
        title="Couldn't load your profile"
        message={error ?? 'User not found.'}
      />
    )
  }

  const activeContent = {
    recipes: <ProfileRecipes userId={user.id} />,
    collections: <CollectionsPlaceholder />,
    settings: (
      <ProfileSettings user={user} auth0Sub={auth0Sub} onUserUpdated={replaceUser} />
    ),
  } satisfies Record<ProfileTab, ReactNode>

  return (
    <div className="flex flex-col gap-8">
      <ProfileHeader user={user} />

      <section className="flex flex-col gap-5">
        <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeContent[activeTab]}
      </section>
    </div>
  )
}
