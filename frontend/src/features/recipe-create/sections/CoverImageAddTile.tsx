import { ImagePlus } from 'lucide-react'

interface CoverImageAddTileProps {
  /** Once photos exist the tile shrinks to thumbnail size and sheds its hint copy. */
  compact: boolean
  onClick: () => void
}

/** The "add a photo" target of `CoverImageDropzone`, in its full and thumbnail-sized looks. */
export function CoverImageAddTile({ compact, onClick }: CoverImageAddTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-secondary text-muted-foreground ${
        compact ? 'aspect-square rounded-xl' : 'aspect-[21/9] rounded-2xl'
      }`}
    >
      <ImagePlus aria-hidden="true" className={compact ? 'h-6 w-6' : 'h-8 w-8'} />
      <p className="text-sm font-semibold text-foreground">{compact ? 'Add' : 'Add a cover photo'}</p>
      {!compact && <p className="font-mono text-xs">Drag &amp; drop or click to browse</p>}
    </button>
  )
}
