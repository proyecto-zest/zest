import type { CurrentUserData } from '../types/user'
import { httpClient } from './httpClient'

/** Creates/synchronizes the local profile from the validated Auth0 claims. */
export const syncCurrentUser = (options?: { signal?: AbortSignal }) =>
  httpClient.get<CurrentUserData>('/users/me', options)

/** The only editable profile field is the display name. */
export const updateCurrentUserName = (name: string) =>
  httpClient.patch<CurrentUserData>('/users/me', { name })
