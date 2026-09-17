import { useEffect, useState } from 'react'
import { httpClient } from '../../services/httpClient'

export interface HealthResponse {
  status: string
}

export type HealthState =
  | { status: 'loading' }
  | { status: 'ok'; data: HealthResponse }
  | { status: 'error'; message: string }

/** Calls the backend's GET /health to verify the end-to-end connection. */
export function useHealthCheck(): HealthState {
  const [state, setState] = useState<HealthState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    httpClient
      .get<HealthResponse>('/health', { signal: controller.signal })
      .then((data) => setState({ status: 'ok', data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      })

    return () => controller.abort()
  }, [])

  return state
}
