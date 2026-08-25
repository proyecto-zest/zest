import { Card } from '../../components/Card'
import { healthMessage } from './healthMessage'
import { useHealthCheck } from './useHealthCheck'

/** Shows the result of GET /health to verify the backend connection. */
export function HealthStatus() {
  const health = useHealthCheck()

  return <Card title="Backend connection">{healthMessage(health)}</Card>
}
