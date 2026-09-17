import { useEffect, useRef, useState } from 'react'
import { validateRecipeImage } from '../../services/recipeImages'

/**
 * Owns the cover image the user picked: the `File` itself (uploaded on submit,
 * not before), its local preview URL, and any validation error. The object URL
 * is revoked when it's replaced or when the form unmounts, so previews don't
 * leak memory.
 *
 * `initialPreview` is the already-stored image when editing — shown until the
 * user picks a different one.
 */
export function useCoverImage(initialPreview?: string) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const objectUrl = useRef<string | null>(null)
  const [preview, setPreview] = useState<string | null>(initialPreview ?? null)

  const releaseObjectUrl = () => {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current)
      objectUrl.current = null
    }
  }

  useEffect(() => releaseObjectUrl, [])

  /** Rejects invalid files before they ever reach the network. */
  const select = (picked: File) => {
    const invalid = validateRecipeImage(picked)
    if (invalid) {
      setError(invalid)
      return
    }

    releaseObjectUrl()
    objectUrl.current = URL.createObjectURL(picked)
    setPreview(objectUrl.current)
    setFile(picked)
    setError(null)
  }

  /** Always clears to no image — including the recipe's existing one on edit, not back to it. */
  const clear = () => {
    releaseObjectUrl()
    setPreview(null)
    setFile(null)
    setError(null)
  }

  return { file, preview, error, select, clear, setError }
}
