import { useEffect, type RefObject } from 'react'

/** Closes on a pointer press outside `ref`. `pointerdown`, not `mousedown`, so iOS Safari taps count too. */
export function useCloseOnOutsidePointer(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, ref, close])
}
