import type { CurrentUserData, PublicUserData } from '../types/user'
import { httpClient } from './httpClient'

/** Creates/synchronizes the local profile from the validated Auth0 claims. */
export const syncCurrentUser = (options?: { signal?: AbortSignal }) =>
  httpClient.get<CurrentUserData>('/users/me', options)

/** The only editable profile field is the display name. */
export const updateCurrentUserName = (name: string) =>
  httpClient.patch<CurrentUserData>('/users/me', { name })

/** Public profile projection; intentionally excludes email and Auth0 fields. */
export const getPublicUser = (id: string, options?: { signal?: AbortSignal }) =>
  httpClient.get<PublicUserData>(`/users/${id}`, options)
