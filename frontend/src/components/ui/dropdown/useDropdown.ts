import { useCallback, useId, useState, type FocusEvent, type RefObject } from 'react'
import { shouldOpenUp } from './shouldOpenUp'
import { useCloseOnOutsidePointer } from './useCloseOnOutsidePointer'
import { useDropdownKeys } from './useDropdownKeys'

/** Open/highlight state and handlers shared by the trigger and the list of `SingleSelectDropdown`. */
export function useDropdown(
  containerRef: RefObject<HTMLElement | null>,
  options: { value: string; label: string }[],
  value: string,
  onChange: (v: string) => void,
  disabled = false,
) {
  const [open, setOpen] = useState(false)
  // Disabled or emptied while open (a catalog reloading): close rather than show a dead list.
  if (open && (disabled || options.length === 0)) setOpen(false)
  const [openUp, setOpenUp] = useState(false)
  const [flash, setFlash] = useState(false)
  const [highlighted, setActiveIndex] = useState(0)
  // Clamped so `aria-activedescendant` never points past a list that shrank while open.
  const activeIndex = Math.max(0, Math.min(highlighted, options.length - 1))
  const listboxId = useId()
  const optionId = useCallback((index: number) => `${listboxId}-option-${index}`, [listboxId])
  const selected = options.find((option) => option.value === value)
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const close = useCallback(() => setOpen(false), [])
  const openMenu = () => {
    if (disabled || options.length === 0) return
    setActiveIndex(selectedIndex)
    setOpenUp(shouldOpenUp(containerRef.current))
    setOpen(true)
  }
  const select = (optionValue: string) => {
    onChange(optionValue)
    close()
    setFlash(true)
  }
  useCloseOnOutsidePointer(open, containerRef, close)
  const hasSelection = selected !== undefined
  const onKeyDown = useDropdownKeys({
    ...{ open, options, activeIndex, selectedIndex, hasSelection, setActiveIndex },
    ...{ openMenu, close, select },
  })
  // Focus moving to another field (not just a pointer press) also dismisses the list.
  const onBlur = (e: FocusEvent) => {
    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) close()
  }

  return {
    ...{ open, openUp, flash, activeIndex, selected, listboxId, optionId },
    ...{ openMenu, close, select, setActiveIndex, setFlash, onKeyDown, onBlur },
  }
}
