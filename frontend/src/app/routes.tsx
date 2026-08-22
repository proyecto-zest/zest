import type { RouteObject } from 'react-router-dom'
import { HealthStatus } from '../features/health/HealthStatus'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HealthStatus />,
  },
]
