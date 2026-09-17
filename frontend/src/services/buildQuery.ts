export type QueryParams = Record<string, string | number | string[] | undefined>

/**
 * Serializes query params into a `?...` string. Drops `undefined` values and
 * repeats the key for arrays (e.g. `ingredient=a&ingredient=b`), matching how
 * Nest's `ValidationPipe` parses repeated query params into a list.
 */
export function buildQuery(params: QueryParams): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item)
    } else {
      search.append(key, String(value))
    }
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}
