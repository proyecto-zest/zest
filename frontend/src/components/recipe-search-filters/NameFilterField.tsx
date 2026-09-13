import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { fieldInputClasses } from '../ui/fieldInputClasses'

interface NameFilterFieldProps {
  value: string
  onChange: (value: string) => void
}

const DEBOUNCE_MS = 300

/**
 * Free-text search. Keeps its own draft so typing feels instant, and only
 * calls `onChange` (which triggers the API request) once the user pauses for
 * `DEBOUNCE_MS` — otherwise every keystroke would fire a request.
 */
export function NameFilterField({ value, onChange }: NameFilterFieldProps) {
  const [draft, setDraft] = useState(value)
  // Tracks the last external `value` seen, so an out-of-band change (e.g. "Clear
  // filters") can resync `draft` during render instead of via a setState-in-effect.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setDraft(value)
  }

  // Always the latest onChange — otherwise a filter change that lands mid-debounce
  // (e.g. picking a category while typing) would fire with a stale closure and
  // overwrite it once the timer runs.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onChangeRef.current(draft), DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  return (
    <div className="relative flex-1">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search recipes…"
        aria-label="Search recipes by name"
        className={fieldInputClasses(undefined, 'w-full pl-10')}
      />
    </div>
  )
}
