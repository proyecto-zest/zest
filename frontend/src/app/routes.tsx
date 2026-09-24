import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { LoginPage } from '../features/auth/LoginPage'
import { SignupPage } from '../features/auth/SignupPage'
import { FeedPage } from '../features/feed/FeedPage'
import { RecipeCreatePage } from '../features/recipe-create/RecipeCreatePage'
import { RecipeDetailPage } from '../features/recipe-detail/RecipeDetailPage'
import { RecipeEditPage } from '../features/recipe-edit/RecipeEditPage'

/**
 * Public: browsing recipes needs no session (shareable links, browsing
 * before signing up). Protected: anything that writes data on the user's
 * behalf.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <FeedPage />,
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
    path: '/recipes/new',
    element: (
      <ProtectedRoute>
        <RecipeCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
]
