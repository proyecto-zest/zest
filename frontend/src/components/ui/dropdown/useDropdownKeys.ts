import type { KeyboardEvent } from 'react'
import { useTypeahead } from './useTypeahead'

const PAGE = 10

/** Where a navigation key moves the highlight, or null when the key isn't one. */
function navigatedIndex(key: string, index: number, last: number): number | null {
  if (key === 'ArrowDown') return Math.min(index + 1, last)
  if (key === 'ArrowUp') return Math.max(index - 1, 0)
  if (key === 'PageDown') return Math.min(index + PAGE, last)
  if (key === 'PageUp') return Math.max(index - PAGE, 0)
  if (key === 'Home') return 0
  if (key === 'End') return last
  return null
}

interface DropdownKeys {
  open: boolean
  options: { value: string; label: string }[]
  activeIndex: number
  selectedIndex: number
  setActiveIndex: (index: number) => void
  openMenu: () => void
  close: () => void
  select: (value: string) => void
}

/** Keyboard handler for the trigger: focus never leaves it, the highlight is virtual. */
export function useDropdownKeys(keys: DropdownKeys) {
  const { open, options, activeIndex, selectedIndex, setActiveIndex, openMenu, close, select } =
    keys
  const typeahead = useTypeahead(options.map((option) => option.label))

  return (e: KeyboardEvent<HTMLButtonElement>) => {
    const next = navigatedIndex(e.key, activeIndex, options.length - 1)
    if (e.key === 'Tab') {
      close()
    } else if (next !== null) {
      e.preventDefault()
      if (open) setActiveIndex(next)
      else if (e.key.startsWith('Arrow')) openMenu()
    } else if (open && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      // The list can be empty while a form's catalog is still loading.
      if (options[activeIndex]) select(options[activeIndex].value)
    } else if (open && e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      close()
    } else if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const match = typeahead(e.key, open ? activeIndex : selectedIndex)
      if (match < 0) return
      if (!open) openMenu()
      setActiveIndex(match)
    }
  }
}
