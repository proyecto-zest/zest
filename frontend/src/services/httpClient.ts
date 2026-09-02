const baseUrl = import.meta.env.VITE_API_URL

if (!baseUrl) {
  throw new Error('Missing VITE_API_URL. Copy .env.example to .env and fill it in.')
}

/** Error carrying the server's validation messages, when it sent any. */
export class HttpError extends Error {
  readonly status: number
  readonly messages: string[]

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? `Request failed (${status})`)
    this.name = 'HttpError'
    this.status = status
    this.messages = messages
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
}

/** Nest sends validation errors as { message: string | string[] }. */
async function readMessages(response: Response): Promise<string[]> {
  const body: unknown = await response.json().catch(() => null)
  const message = (body as { message?: unknown })?.message
  if (Array.isArray(message)) return message as string[]
  if (typeof message === 'string') return [message]
  return [`Request failed (${response.status})`]
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })

  if (!response.ok) {
    throw new HttpError(response.status, await readMessages(response))
  }

  return (await response.json()) as T
}

export const httpClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, options),
  post: <T>(path: string, body: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
}
