import { useRef, type DragEvent } from 'react'
import { Alert } from '../../../components/alert'
import { CoverImageAddTile } from './CoverImageAddTile'
import { CoverImagePreview } from './CoverImagePreview'

interface CoverImageDropzoneProps {
  preview: string | null
  error: string | null
  /** True while the picked file is being uploaded to S3 on submit. */
  uploading: boolean
  onSelect: (file: File) => void
  onClear: () => void
}

/**
 * Cover image picker: click (or tap, which opens the native picker) and
 * drag-and-drop, with a preview of the current choice. Controlled by
 * `useCoverImage` — the file is only uploaded when the form is submitted.
 */
export function CoverImageDropzone({ preview, error, uploading, onSelect, onClear }: CoverImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const selectFirst = (files: FileList | null) => {
    const picked = files?.[0]
    if (picked) onSelect(picked)
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e: DragEvent) => e.preventDefault()}
        onDrop={(e: DragEvent) => {
          e.preventDefault()
          if (!uploading) selectFirst(e.dataTransfer.files)
        }}
      >
        {preview ? (
          <CoverImagePreview src={preview} uploading={uploading} onRemove={onClear} />
        ) : (
          <CoverImageAddTile onClick={() => inputRef.current?.click()} />
        )}
      </div>

      {error && <Alert variant="error" message={error} />}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          selectFirst(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
