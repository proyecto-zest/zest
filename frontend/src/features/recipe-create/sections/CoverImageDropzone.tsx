import { ImagePlus } from 'lucide-react'

/**
 * Cover image upload — mocked per the ticket. No file input, no state: it's
 * a visual placeholder until image upload is built.
 */
export function CoverImageDropzone() {
  return (
    <div
      aria-disabled="true"
      className="flex aspect-[21/9] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary text-muted-foreground"
    >
      <ImagePlus aria-hidden="true" className="h-8 w-8" />
      <p className="text-sm font-semibold text-foreground">Add a cover photo</p>
      <p className="font-mono text-xs">Coming soon</p>
    </div>
  )
}
