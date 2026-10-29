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
) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [flash, setFlash] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const listboxId = useId()
  const optionId = useCallback((index: number) => `${listboxId}-option-${index}`, [listboxId])
  const selected = options.find((option) => option.value === value)
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const close = useCallback(() => setOpen(false), [])

  const openMenu = () => {
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
  const onKeyDown = useDropdownKeys({
    open,
    options,
    activeIndex,
    selectedIndex,
    setActiveIndex,
    openMenu,
    close,
    select,
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
