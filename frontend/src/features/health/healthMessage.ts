import type { HealthState } from './useHealthCheck'

/** Human-readable summary of a health check result. */
export function healthMessage(state: HealthState): string {
  switch (state.status) {
    case 'loading':
      return 'Checking…'
    case 'ok':
      return `Backend reachable: ${state.data.status}`
    case 'error':
      return `Could not connect: ${state.message}`
  }
}
