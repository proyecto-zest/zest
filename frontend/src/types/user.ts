/** Private profile projection returned by GET/PATCH /users/me. */
export interface CurrentUserData {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}
