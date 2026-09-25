import type { RouteObject } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { RedirectIfAuthenticated } from '../auth/RedirectIfAuthenticated'
import { LoginPage } from '../features/auth/LoginPage'
import { SignupPage } from '../features/auth/SignupPage'
import { FeedPage } from '../features/feed/FeedPage'
import { RecipeCreatePage } from '../features/recipe-create/RecipeCreatePage'
import { RecipeDetailPage } from '../features/recipe-detail/RecipeDetailPage'
import { RecipeEditPage } from '../features/recipe-edit/RecipeEditPage'

/**
 * The backend requires a token on every recipe endpoint, so nothing here can
 * actually work without a session — everything is protected except `/login`
 * and `/signup` themselves, which redirect away *from* an authenticated
 * visitor instead.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <FeedPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/recipes/:id',
    element: (
      <ProtectedRoute>
        <RecipeDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/recipes/:id/edit',
    element: (
      <ProtectedRoute>
        <RecipeEditPage />
      </ProtectedRoute>
    ),
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
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: '/signup',
    element: (
      <RedirectIfAuthenticated>
        <SignupPage />
      </RedirectIfAuthenticated>
    ),
  },
]
