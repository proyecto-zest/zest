import { Loader2, X } from 'lucide-react'
import { useState } from 'react'

interface CoverImagePreviewProps {
  src: string
  /** Dims the image and swaps the remove button for a spinner while uploading. */
  uploading: boolean
  onRemove: () => void
}

/** The chosen cover image, with a control to drop it and pick another. */
export function CoverImagePreview({ src, uploading, onRemove }: CoverImagePreviewProps) {
  // The parent unmounts this whole component the instant `onRemove` changes
  // its state, which would cut the shrink animation off after one frame —
  // play it locally first, then tell the parent once it's done.
  const [removing, setRemoving] = useState(false)

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
          onClick={() => setRemoving(true)}
          onTransitionEnd={() => removing && onRemove()}
          aria-label="Remove image"
          className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/70 text-background transition-all duration-200 hover:bg-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
            removing ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
