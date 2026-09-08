import type { RouteObject } from 'react-router-dom'
import { FeedPage } from '../features/feed/FeedPage'
import { RecipeCreatePage } from '../features/recipe-create/RecipeCreatePage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <FeedPage />,
  },
  {
    path: '/recipes/new',
    element: <RecipeCreatePage />,
  },
]
