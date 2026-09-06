import { useState } from 'react'
import { ImageOff } from 'lucide-react'

interface RecipeImageProps {
  src: string
  alt: string
}

/**
 * Recipe cover image with a graceful fallback, used by both `RecipeCard` and
 * the recipe detail header. The API always sends a URL (it falls back to a
 * default asset server-side), but that asset may not exist in every
 * environment — a broken URL must not break the layout around it.
 */
export function RecipeImage({ src, alt }: RecipeImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
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
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  )
}
