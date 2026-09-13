import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
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
 *
 * Keyboard focus stays on the trigger button the whole time (as in the ARIA
 * "collapsible dropdown listbox" pattern) — arrow keys move a virtual
 * highlight communicated via `aria-activedescendant`, so there's no focus to
 * move into the list or return once it closes.
 */
export function SingleSelectDropdown({ placeholder, options, value, onChange, 'aria-label': ariaLabel }: SingleSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const [flash, setFlash] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const optionId = (index: number) => `${listboxId}-option-${index}`

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))

  const openMenu = () => {
    setActiveIndex(selectedIndex)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const selected = options.find((option) => option.value === value)

  const selectOption = (optionValue: string) => {
    onChange(optionValue)
    setOpen(false)
    setFlash(true)
  }

  const onButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        openMenu()
        return
      }
      const delta = e.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((i) => Math.min(Math.max(i + delta, 0), options.length - 1))
    } else if (e.key === 'Home' && open) {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === 'End' && open) {
      e.preventDefault()
      setActiveIndex(options.length - 1)
    } else if ((e.key === 'Enter' || e.key === ' ') && open) {
      e.preventDefault()
      selectOption(options[activeIndex].value)
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onButtonKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        aria-label={ariaLabel}
        onAnimationEnd={() => setFlash(false)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3.5 py-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${flash ? 'animate-select-flash' : ''}`}
      >
        {selected?.label ?? placeholder}
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 top-full z-10 mt-1 max-h-64 w-full min-w-[10rem] origin-top animate-dropdown-in overflow-y-auto rounded-lg border border-border bg-card p-1.5 shadow-lg"
        >
          {options.map((option, index) => (
            <li key={option.value} role="presentation">
              <button
                type="button"
                id={optionId(index)}
                role="option"
                tabIndex={-1}
                aria-selected={option.value === value}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option.value)}
                className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm ${
                  index === activeIndex ? 'bg-secondary' : ''
                } ${option.value === value ? 'font-medium text-foreground' : 'text-foreground'}`}
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
