import { Navigate, useParams } from 'react-router-dom'
import { useCurrentUser } from '../../auth/useCurrentUser'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import { ProfilePageSkeleton } from './ProfilePageSkeleton'
import { ProfileRecipes } from './ProfileRecipes'
import { ProfileView } from './ProfileView'
import { UserNotFound } from './UserNotFound'
import { usePublicUser } from './usePublicUser'

/** Read-only profile at `/profile/:id`, with self-profile redirection. */
export function PublicProfilePage() {
  const { id } = useParams()
  const { user: currentUser, loading, error } = useCurrentUser()

  if (!id) return <UserNotFound />
  if (loading) return <ProfilePageSkeleton />
  if (error || !currentUser) {
    return (
      <Alert
        variant="error"
        title="Couldn't identify your session"
        message={error ?? 'User not found.'}
      />
    )
  }
  if (id === currentUser.id) return <Navigate to="/profile" replace />

  return <PublicProfileContent id={id} />
}

function PublicProfileContent({ id }: { id: string }) {
  const { state, retry } = usePublicUser(id)

  if (state.status === 'loading') return <ProfilePageSkeleton />
  if (state.status === 'notFound') return <UserNotFound />
  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert variant="error" title="Couldn't load this profile" message={state.message} />
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <ProfileView user={state.user}>
      <h2 className="border-b border-border pb-3 font-serif text-xl font-bold text-foreground">
        Recipes
      </h2>
      <ProfileRecipes userId={state.user.id} />
    </ProfileView>
  )
}
