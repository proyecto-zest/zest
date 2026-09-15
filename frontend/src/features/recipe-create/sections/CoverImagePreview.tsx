import { Loader2, X } from 'lucide-react'

interface CoverImagePreviewProps {
  src: string
  /** Dims the image and swaps the remove button for a spinner while uploading. */
  uploading: boolean
  onRemove: () => void
}

/** The chosen cover image, with a control to drop it and pick another. */
export function CoverImagePreview({ src, uploading, onRemove }: CoverImagePreviewProps) {
  return (
    <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-border bg-muted">
      <img src={src} alt="" className={`h-full w-full object-cover ${uploading ? 'opacity-60' : ''}`} />

      {uploading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-foreground" />
          <span className="sr-only">Uploading image…</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove image"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/70 text-background"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
