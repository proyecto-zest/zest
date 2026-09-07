import { useState } from 'react'
import { ImageOff } from 'lucide-react'

interface RecipeCardImageProps {
  /** Optional: `imageUrls[0]` is `undefined` when a recipe has no images. */
  src?: string
  alt: string
}

/**
 * Cover image with a graceful fallback. The API is expected to always send a
 * URL (it falls back to a default asset server-side), but that asset may not
 * exist in every environment, and the array itself could be empty — either
 * way, a missing or broken image must not break the card's layout.
 */
export function RecipeCardImage({ src, alt }: RecipeCardImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <ImageOff aria-hidden="true" className="h-8 w-8" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      decoding="async"
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  )
}
