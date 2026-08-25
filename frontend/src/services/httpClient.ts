const baseUrl = import.meta.env.VITE_API_URL

if (!baseUrl) {
  throw new Error('Missing VITE_API_URL. Copy .env.example to .env and fill it in.')
}

export class HttpError extends Error {
  readonly status: number
  readonly statusText: string

  constructor(status: number, statusText: string) {
    super(`${status} ${statusText}`)
    this.name = 'HttpError'
    this.status = status
    this.statusText = statusText
  }
}

interface RequestOptions {
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    signal: options.signal,
  })

  if (!response.ok) {
    throw new HttpError(response.status, response.statusText)
  }

  return (await response.json()) as T
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
}
