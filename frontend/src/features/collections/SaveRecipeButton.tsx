import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { SaveToCollectionModal } from './SaveToCollectionModal'

interface SaveRecipeButtonProps {
  recipe: { id: string; title: string }
  iconOnly?: boolean
}

export function SaveRecipeButton({ recipe, iconOnly = false }: SaveRecipeButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        aria-label="Save to collection"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
        className={
          iconOnly
            ? 'absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            : 'inline-flex items-center justify-center gap-2 self-start rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        }
      >
        <Bookmark aria-hidden="true" className="h-4 w-4" />
        {!iconOnly && 'Save to collection'}
      </button>
      {open && <SaveToCollectionModal recipe={recipe} onClose={() => setOpen(false)} />}
    </>
  )
}
