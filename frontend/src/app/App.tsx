import { useRoutes } from 'react-router-dom'
import { SiteShell } from '../components/nav/SiteShell'
import { routes } from './routes'

export function App() {
  const element = useRoutes(routes)

  return <SiteShell>{element}</SiteShell>
}
