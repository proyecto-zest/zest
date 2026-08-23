import { describe, expect, it } from 'vitest'
import { healthMessage } from './healthMessage'

describe('healthMessage', () => {
  it('reports progress while loading', () => {
    expect(healthMessage({ status: 'loading' })).toBe('Checking…')
  })

  it('includes the backend status when reachable', () => {
    expect(healthMessage({ status: 'ok', data: { status: 'ok' } })).toBe('Backend reachable: ok')
  })

  it('includes the reason when the request fails', () => {
    expect(healthMessage({ status: 'error', message: '503 Service Unavailable' })).toBe(
      'Could not connect: 503 Service Unavailable',
    )
  })
})
