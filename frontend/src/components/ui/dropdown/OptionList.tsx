import { useScrollToActive } from './useScrollToActive'

interface OptionListProps {
  id: string
  optionId: (index: number) => string
  options: { value: string; label: string }[]
  value: string
  activeIndex: number
  openUp: boolean
  onHover: (index: number) => void
  onSelect: (value: string) => void
}

/** The open listbox. Long lists (the ingredient catalog) scroll to keep the highlight visible. */
export function OptionList({
  id,
  optionId,
  options,
  value,
  activeIndex,
  openUp,
  onHover,
  onSelect,
}: OptionListProps) {
  const markHover = useScrollToActive(activeIndex, optionId)

  return (
    <ul
      id={id}
      role="listbox"
      className={`absolute left-0 z-dropdown max-h-64 w-full min-w-[10rem] animate-dropdown-in overflow-y-auto rounded-lg border border-border bg-card p-1.5 shadow-lg [scrollbar-color:rgb(var(--color-border))_transparent] [scrollbar-width:thin] ${
        openUp ? 'bottom-full mb-1 origin-bottom' : 'top-full mt-1 origin-top'
      }`}
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
            onMouseEnter={() => {
              markHover()
              onHover(index)
            }}
            onClick={() => onSelect(option.value)}
            className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm text-foreground ${
              index === activeIndex ? 'bg-secondary' : ''
            } ${option.value === value ? 'font-medium' : ''}`}
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  )
}
