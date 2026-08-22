import { useHealthCheck } from './useHealthCheck'

/** Shows the result of GET /health to verify the backend connection. */
export function HealthStatus() {
  const health = useHealthCheck()

  return (
    <section className="rounded-lg border border-neutral-200 p-4 sm:p-6">
      <h2 className="text-lg font-medium">Backend connection</h2>

      {health.status === 'loading' && <p className="mt-2 text-sm text-neutral-500">Checking…</p>}

      {health.status === 'ok' && (
        <p className="mt-2 text-sm text-neutral-700">
          Backend reachable: <code>{health.data.status}</code>
        </p>
      )}

      {health.status === 'error' && (
        <p className="mt-2 text-sm text-neutral-700">Could not connect: {health.message}</p>
      )}
    </section>
  )
}
