import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface SingleSelectDropdownProps {
  /** Shown on the closed button when nothing (or the "any" option) is selected. */
  placeholder: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  'aria-label': string
}

/**
 * Custom single-select dropdown — a button that opens a listbox styled with
 * the app's own tokens, so the open menu matches the page like the rest of
 * the UI. A native `<select>`'s open dropdown is rendered by the OS/browser
 * and can't be restyled (not even font-family), which is why this exists
 * instead of `SelectField` for the recipe search filters.
 */
export function SingleSelectDropdown({ placeholder, options, value, onChange, 'aria-label': ariaLabel }: SingleSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const [flash, setFlash] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const selected = options.find((option) => option.value === value)

  const selectOption = (optionValue: string) => {
    onChange(optionValue)
    setOpen(false)
    setFlash(true)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onAnimationEnd={() => setFlash(false)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3.5 py-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${flash ? 'animate-select-flash' : ''}`}
      >
        {selected?.label ?? placeholder}
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-10 mt-1 max-h-64 w-full min-w-[10rem] origin-top animate-dropdown-in overflow-y-auto rounded-lg border border-border bg-card p-1.5 shadow-lg"
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => selectOption(option.value)}
                className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-secondary ${
                  option.value === value ? 'font-medium text-foreground' : 'text-foreground'
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
