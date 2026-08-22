import { useRoutes } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { routes } from './routes'

export function App() {
  const element = useRoutes(routes)

  return <Layout>{element}</Layout>
}
