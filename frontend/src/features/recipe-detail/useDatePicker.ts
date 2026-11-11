import type { ChangeEvent, MouseEvent } from 'react'
import { useRef } from 'react'

/**
 * Wires a label to an invisible `<input type="date">` inside it: clicking the
 * label opens the picker (`showPicker()`, or `click()` where it is missing or
 * refuses), and a chosen day goes to `onPick` as `YYYY-MM-DD`.
 */
export function useDatePicker(onPick: (date: string) => void, disabled: boolean) {
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = (event: MouseEvent) => {
    event.preventDefault()
    const input = inputRef.current
    if (!input || disabled) return
    try {
      input.showPicker()
    } catch {
      input.click()
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    // Cleared so picking the same day again still fires `change`.
    event.target.value = ''
    if (value) onPick(value)
  }

  return { inputRef, openPicker, handleChange }
}
