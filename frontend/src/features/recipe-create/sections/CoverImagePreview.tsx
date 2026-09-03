import { X } from 'lucide-react'

export interface PickedImage {
  id: string
  url: string
}

interface CoverImagePreviewProps {
  images: PickedImage[]
  onRemove: (id: string) => void
}

/** Thumbnails for the images picked in `CoverImageDropzone`. Bare tiles — the parent owns the grid. */
export function CoverImagePreview({ images, onRemove }: CoverImagePreviewProps) {
  return (
    <>
      {images.map((image) => (
        <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl border border-border">
          <img src={image.url} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            aria-label="Remove image"
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-background"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </>
  )
}
