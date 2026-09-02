import type { RouteObject } from 'react-router-dom'
import { HealthStatus } from '../features/health/HealthStatus'
import { RecipeCreatePage } from '../features/recipe-create/RecipeCreatePage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HealthStatus />,
  },
  {
    path: '/recipes/new',
    element: <RecipeCreatePage />,
  },
]
