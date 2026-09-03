import { ImagePlus } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { CoverImagePreview, type PickedImage } from './CoverImagePreview'

/** Cover image picker: click or drag-and-drop, with previews. Client-side only — no upload endpoint yet. */
export function CoverImageDropzone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<PickedImage[]>([])

  const addFiles = (files: FileList | null) => {
    const picked = Array.from(files ?? [])
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file) }))
    if (picked.length > 0) setImages((prev) => [...prev, ...picked])
  }

  const removeImage = (id: string) =>
    setImages((prev) => {
      const target = prev.find((image) => image.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((image) => image.id !== id)
    })

  return (
    <div className="flex flex-col gap-3">
      <CoverImagePreview images={images} onRemove={removeImage} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e: DragEvent) => e.preventDefault()}
        onDrop={(e: DragEvent) => {
          e.preventDefault()
          addFiles(e.dataTransfer.files)
        }}
        className="flex aspect-[21/9] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary text-muted-foreground"
      >
        <ImagePlus aria-hidden="true" className="h-8 w-8" />
        <p className="text-sm font-semibold text-foreground">
          {images.length > 0 ? 'Add more photos' : 'Add a cover photo'}
        </p>
        <p className="font-mono text-xs">Drag & drop or click to browse</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
