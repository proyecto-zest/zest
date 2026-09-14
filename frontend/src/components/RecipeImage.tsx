import { useState } from 'react'
import { ImageOff } from 'lucide-react'

interface RecipeImageProps {
  /** Optional: `imageUrls[0]` is `undefined` when a recipe has no images. */
  src?: string
  alt: string
}

/**
 * Recipe cover image with a graceful fallback, used by both `RecipeCard` and
 * the recipe detail header. The API is expected to always send a URL (it
 * falls back to a default asset server-side), but that asset may not exist in
 * every environment, and the array itself could be empty — either way, a
 * missing or broken image must not break the layout around it.
 *
 * Fades in on load instead of popping in abruptly the instant the download
 * finishes — the same reason the surrounding card/header wrap this in
 * `bg-muted`, so there's a filled placeholder to fade over rather than a
 * flash of empty space.
 */
export function RecipeImage({ src, alt }: RecipeImageProps) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

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
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      decoding="async"
      className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  )
}
