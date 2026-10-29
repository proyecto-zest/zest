import { useEffect, useRef } from 'react'

const RESET_MS = 700

/** First label starting with `query`, searching from `from` and wrapping; -1 if none. */
export function typeaheadIndex(labels: string[], query: string, from: number): number {
  // Pressing one letter repeatedly cycles through the options that start with it.
  const cycle = [...query].every((char) => char === query[0])
  const prefix = cycle ? query[0] : query
  const start = cycle ? from + 1 : from
  for (let i = 0; i < labels.length; i++) {
    const index = (start + i) % labels.length
    if (labels[index].toLowerCase().startsWith(prefix)) return index
  }
  return -1
}

/** Returns a function that takes a typed character and gives the index to highlight (-1 for none). */
export function useTypeahead(labels: string[]) {
  const buffer = useRef('')
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (char: string, from: number) => {
    buffer.current += char.toLowerCase()
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => (buffer.current = ''), RESET_MS)
    return typeaheadIndex(labels, buffer.current, from)
  }
}
