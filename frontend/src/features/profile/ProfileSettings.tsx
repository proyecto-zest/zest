import { useState, type FormEvent } from 'react'
import { KeyRound, Save } from 'lucide-react'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { requestPasswordChange } from '../../services/auth0'
import { HttpError } from '../../services/httpClient'
import { updateCurrentUserName } from '../../services/users'
import type { CurrentUserData } from '../../types/user'

interface ProfileSettingsProps {
  user: CurrentUserData
  auth0Sub: string | null
  onUserUpdated: (user: CurrentUserData) => void
}

type Feedback = { variant: 'success' | 'error'; message: string } | null

/** Own-profile settings: display name plus Auth0's email password reset flow. */
export function ProfileSettings({ user, auth0Sub, onUserUpdated }: ProfileSettingsProps) {
  const [name, setName] = useState(user.name)
  const [saving, setSaving] = useState(false)
  const [nameFeedback, setNameFeedback] = useState<Feedback>(null)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null)

  const saveName = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setNameFeedback({ variant: 'error', message: 'Name cannot be empty.' })
      return
    }

    setSaving(true)
    setNameFeedback(null)
    try {
      const updatedUser = await updateCurrentUserName(trimmedName)
      onUserUpdated(updatedUser)
      setName(updatedUser.name)
      setNameFeedback({ variant: 'success', message: 'Your name was updated.' })
    } catch (error) {
      const message =
        error instanceof HttpError
          ? error.messages
          : error instanceof Error
            ? error.message
            : 'Could not update your name.'
      setNameFeedback({
        variant: 'error',
        message: Array.isArray(message) ? message.join(' ') : message,
      })
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    setResettingPassword(true)
    setPasswordFeedback(null)
    try {
      await requestPasswordChange(user.email)
      setPasswordFeedback({
        variant: 'success',
        message: `We sent a password reset email to ${user.email}.`,
      })
    } catch (error) {
      setPasswordFeedback({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Could not request the password reset.',
      })
    } finally {
      setResettingPassword(false)
    }
  }

  const hasDatabasePassword = auth0Sub?.startsWith('auth0|') ?? false

  return (
    <section className="rounded-3xl border border-border bg-card p-5 tablet:p-6">
      <h2 className="font-serif text-xl font-bold text-foreground">Settings</h2>

      <form onSubmit={saveName} className="mt-5 flex max-w-xl flex-col gap-4">
        <TextField label="Name" value={name} onChange={setName} disabled={saving} required />
        {nameFeedback && <Alert variant={nameFeedback.variant} message={nameFeedback.message} />}
        <Button variant="primary" type="submit" disabled={saving} className="self-start">
          <Save aria-hidden="true" className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save name'}
        </Button>
      </form>

      {hasDatabasePassword && (
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="font-semibold text-foreground">Password</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Auth0 will email you a secure link. Zest never receives your password.
          </p>
          {passwordFeedback && (
            <div className="mt-4 max-w-xl">
              <Alert variant={passwordFeedback.variant} message={passwordFeedback.message} />
            </div>
          )}
          <Button
            variant="secondary"
            onClick={changePassword}
            disabled={resettingPassword}
            className="mt-4"
          >
            <KeyRound aria-hidden="true" className="h-4 w-4" />
            {resettingPassword ? 'Sending…' : 'Change password'}
          </Button>
        </div>
      )}
    </section>
  )
}
