import type { CurrentUserData } from '../types/user'
import { httpClient } from './httpClient'

/** Resolves the authenticated Auth0 identity to its local Zest user. */
export const getCurrentUser = (options?: { signal?: AbortSignal }) =>
  httpClient.get<CurrentUserData>('/users/me', options)
