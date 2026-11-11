import { useEffect, useRef } from 'react'

/**
 * Keeps the highlighted option in view when the keyboard or typeahead moves it.
 * Returns a function to call before a hover moves it, so the list doesn't scroll under the cursor.
 */
export function useScrollToActive(activeIndex: number, optionId: (index: number) => string) {
  const hovered = useRef(false)
  useEffect(() => {
    if (hovered.current) hovered.current = false
    else document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, optionId])
  return () => {
    hovered.current = true
  }
}
