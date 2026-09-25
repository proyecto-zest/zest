import type { RouteObject } from 'react-router-dom'
import { CurrentUserProvider } from '../auth/CurrentUserProvider'
import { FeedPage } from '../features/feed/FeedPage'
import { RecipeCreatePage } from '../features/recipe-create/RecipeCreatePage'
import { RecipeDetailPage } from '../features/recipe-detail/RecipeDetailPage'
import { RecipeEditPage } from '../features/recipe-edit/RecipeEditPage'
import { ProfilePage } from '../features/profile/ProfilePage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <FeedPage />,
  },
  {
    path: '/recipes/new',
    element: <RecipeCreatePage />,
  },
  {
    path: '/recipes/:id',
    element: <RecipeDetailPage />,
  },
  {
    path: '/recipes/:id/edit',
    element: <RecipeEditPage />,
  },
  {
    path: '/profile',
    // ZEST-32 will wrap this route with its Auth0 ProtectedRoute when merged.
    element: (
      <CurrentUserProvider>
        <ProfilePage />
      </CurrentUserProvider>
    ),
  },
]
