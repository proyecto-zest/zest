/**
 * Lets `httpClient` (a plain module, outside the component tree) reach
 * Auth0's `getAccessTokenSilently` without every caller having to thread it
 * through. `AuthTokenBridge` is the only place that calls `setTokenGetter`,
 * once, from inside `useAuth0`.
 */
type TokenGetter = () => Promise<string>

let getToken: TokenGetter | null = null

export function setTokenGetter(getter: TokenGetter): void {
  getToken = getter
}

/** Throws if the bridge hasn't mounted yet, or if the token can't be renewed — callers decide what that means (see `httpClient`). */
export function getAccessToken(): Promise<string> {
  if (!getToken) return Promise.reject(new Error('Auth0 token getter not initialized yet.'))
  return getToken()
}
