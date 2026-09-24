/** The fields from GET /users/me that the frontend needs for ownership checks. */
export interface CurrentUserData {
  id: string
  name: string
  avatarUrl: string | null
}
