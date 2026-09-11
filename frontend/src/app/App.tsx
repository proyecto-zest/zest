import { useRoutes } from 'react-router-dom'
import { SiteShell } from '../components/nav/SiteShell'
import { routes } from './routes'
import { useScrollRestoration } from './useScrollRestoration'

export function App() {
  const element = useRoutes(routes)
  useScrollRestoration()

  return <SiteShell>{element}</SiteShell>
}
