import { ImagePlus } from 'lucide-react'

interface CoverImageAddTileProps {
  onClick: () => void
}

/** The "add a photo" target of `CoverImageDropzone`, shown until an image is picked. */
export function CoverImageAddTile({ onClick }: CoverImageAddTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-[21/9] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary text-muted-foreground"
    >
      <ImagePlus aria-hidden="true" className="h-8 w-8" />
      <p className="text-sm font-semibold text-foreground">Add a cover photo</p>
      <p className="font-mono text-xs">JPEG, PNG or WebP · up to 5 MB</p>
    </button>
  )
}
