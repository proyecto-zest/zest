import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHealthCheck } from './useHealthCheck'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useHealthCheck', () => {
  it('reports ok when the backend responds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
    )

    const { result } = renderHook(() => useHealthCheck())

    await waitFor(() => {
      expect(result.current.status).toBe('ok')
    })
  })

  it('reports error when the backend fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 503, statusText: 'Service Unavailable' }),
    )

    const { result } = renderHook(() => useHealthCheck())

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
  })

  it('requests /health against the configured baseURL', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }))

    renderHook(() => useHealthCheck())

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3000/health',
        expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
      )
    })
  })
})
