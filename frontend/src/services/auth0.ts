const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const databaseConnection = import.meta.env.VITE_AUTH0_DB_CONNECTION

/**
 * Starts Auth0's email-based password reset. The frontend never receives or
 * handles either the old or the new password.
 */
export async function requestPasswordChange(email: string): Promise<void> {
  if (!domain || !clientId || !databaseConnection) {
    throw new Error('Password reset is not configured for this environment.')
  }

  const response = await fetch(`https://${domain}/dbconnections/change_password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, email, connection: databaseConnection }),
  })

  if (!response.ok) {
    throw new Error('Could not request the password reset. Please try again.')
  }
}
