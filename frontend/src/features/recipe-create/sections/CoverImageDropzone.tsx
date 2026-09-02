import { useRef, useState, type DragEvent } from 'react'
import { CoverImageAddTile } from './CoverImageAddTile'
import { CoverImagePreview, type PickedImage } from './CoverImagePreview'

/**
 * Cover image picker: click or drag-and-drop, with previews. Once there are
 * images the picker shrinks into one more tile of their grid, so it stops
 * dwarfing the thumbnails. Client-side only — no upload endpoint yet.
 */
export function CoverImageDropzone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<PickedImage[]>([])
  const hasImages = images.length > 0

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
    <div
      onDragOver={(e: DragEvent) => e.preventDefault()}
      onDrop={(e: DragEvent) => {
        e.preventDefault()
        addFiles(e.dataTransfer.files)
      }}
      className={hasImages ? 'grid grid-cols-3 gap-3 tablet:grid-cols-4' : undefined}
    >
      <CoverImagePreview images={images} onRemove={removeImage} />
      <CoverImageAddTile compact={hasImages} onClick={() => inputRef.current?.click()} />
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
