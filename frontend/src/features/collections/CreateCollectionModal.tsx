import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Alert } from '../../components/alert'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TextField } from '../../components/ui/TextField'
import { uploadCollectionCover } from '../../services/collectionImages'
import { createCollection, type CreatedCollection } from '../../services/collections'
import { CoverImageDropzone } from '../recipe-create/sections/CoverImageDropzone'
import { useCoverImage } from '../recipe-create/useCoverImage'

interface CreateCollectionModalProps {
  onClose: () => void
  onCreated: (collection: CreatedCollection) => void
}

const accentColors = ['#e8415a', '#f2735a', '#f5c842', '#7dc242'] as const

/** Shared creation dialog: the caller decides what to do with the new collection. */
export function CreateCollectionModal({ onClose, onCreated }: CreateCollectionModalProps) {
  const [name, setName] = useState('')
  const cover = useCoverImage()
  const [accentColor, setAccentColor] = useState<string>(accentColors[0])
  const [nameError, setNameError] = useState('')
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const close = () => {
    if (!submitting) onClose()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('Enter a collection name.')
      return
    }

    setSubmitting(true)
    setApiError('')
    try {
      let coverImageKey: string | undefined
      if (cover.file) {
        setUploading(true)
        cover.setError(null)
        try {
          coverImageKey = await uploadCollectionCover(cover.file)
        } catch (error) {
          cover.setError(
            error instanceof Error
              ? error.message
              : 'Could not upload the cover photo. Please try again.',
          )
          return
        } finally {
          setUploading(false)
        }
      }

      const created = await createCollection({
        name: trimmedName,
        accentColor,
        ...(coverImageKey ? { coverImageKey } : {}),
      })
      onCreated(created)
      onClose()
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Could not create collection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal labelledBy="new-collection-title" onClose={close}>
      <form
        onSubmit={submit}
        className="flex max-h-[88vh] flex-col overflow-hidden rounded-3xl bg-background shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 id="new-collection-title" className="font-serif text-2xl font-bold text-foreground">
            New collection
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            disabled={submitting}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          {apiError && <Alert variant="error" message={apiError} />}

          <TextField
            label="Collection name"
            placeholder="e.g. Weeknight Dinners"
            value={name}
            onChange={(value) => {
              setName(value)
              setNameError('')
            }}
            disabled={submitting}
            error={nameError}
          />

          <fieldset disabled={submitting}>
            <legend className="mb-2 text-sm font-semibold text-foreground">
              Cover photo (optional)
            </legend>
            <CoverImageDropzone
              preview={cover.preview}
              error={cover.error}
              uploading={uploading}
              onSelect={(file) => {
                if (!submitting) cover.select(file)
              }}
              onClear={() => {
                if (!submitting) cover.clear()
              }}
            />
          </fieldset>

          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">Accent color</p>
            <div role="group" aria-label="Accent color" className="flex gap-3">
              {accentColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Select accent color ${color}`}
                  aria-pressed={accentColor === color}
                  onClick={() => setAccentColor(color)}
                  disabled={submitting}
                  className="h-8 w-8 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    backgroundColor: color,
                    boxShadow:
                      accentColor === color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {uploading ? 'Uploading photo…' : submitting ? 'Creating…' : 'Create collection'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
