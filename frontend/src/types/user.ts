/** Private profile projection returned by GET/PATCH /users/me. */
export interface CurrentUserData {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

/** Safe public projection returned by GET /users/:id. */
export interface PublicUserData {
  id: string
  name: string
  avatarUrl: string | null
}
