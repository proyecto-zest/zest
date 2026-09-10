import type { RouteObject } from 'react-router-dom'
import { FeedPage } from '../features/feed/FeedPage'
import { RecipeCreatePage } from '../features/recipe-create/RecipeCreatePage'
import { RecipeDetailPage } from '../features/recipe-detail/RecipeDetailPage'
import { RecipeEditPage } from '../features/recipe-edit/RecipeEditPage'

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
]
