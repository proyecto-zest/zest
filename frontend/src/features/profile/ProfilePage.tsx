import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert } from '../../components/alert'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { CollectionsPlaceholder } from './CollectionsPlaceholder'
import { ProfilePageSkeleton } from './ProfilePageSkeleton'
import { ProfileRecipes } from './ProfileRecipes'
import { ProfileSettings } from './ProfileSettings'
import { ProfileTabs, type ProfileTab } from './ProfileTabs'
import { ProfileView } from './ProfileView'

/** The authenticated user's profile at `/profile`. */
export function ProfilePage() {
  const { user, auth0Sub, loading, error, replaceUser } = useCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTab = searchParams.get('tab')
  const activeTab: ProfileTab =
    selectedTab === 'settings' || selectedTab === 'collections' ? selectedTab : 'recipes'

  const setActiveTab = (tab: ProfileTab) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (tab === 'recipes') next.delete('tab')
      else next.set('tab', tab)
      return next
    })
  }

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
    recipes: <ProfileRecipes userId={user.id} currentUserId={user.id} />,
    collections: <CollectionsPlaceholder />,
    settings: <ProfileSettings user={user} auth0Sub={auth0Sub} onUserUpdated={replaceUser} />,
  } satisfies Record<ProfileTab, ReactNode>

  return (
    <ProfileView user={user}>
      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
      {activeContent[activeTab]}
    </ProfileView>
  )
}
