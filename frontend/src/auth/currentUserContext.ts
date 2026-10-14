import { createContext } from 'react'
import type { CurrentUserData } from '../types/user'

export interface CurrentUserContextValue {
  user: CurrentUserData | null
  auth0Sub: string | null
  loading: boolean
  error: string | null
  replaceUser: (user: CurrentUserData) => void
}

export const CurrentUserContext = createContext<CurrentUserContextValue | null>(null)
