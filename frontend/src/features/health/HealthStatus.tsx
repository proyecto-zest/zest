import { Alert } from '../../components/alert'
import { Card } from '../../components/Card'
import { healthMessage } from './healthMessage'
import { useHealthCheck } from './useHealthCheck'

/** Shows the result of GET /health to verify the backend connection. */
export function HealthStatus() {
  const health = useHealthCheck()

  return (
    <Card title="Backend connection">
      {health.status === 'loading' ? (
        <p>{healthMessage(health)}</p>
      ) : (
        <Alert
          variant={health.status === 'ok' ? 'success' : 'error'}
          message={healthMessage(health)}
        />
      )}
    </Card>
  )
}
