import { useRef } from 'react'
import { DropdownTrigger } from './dropdown/DropdownTrigger'
import { OptionList } from './dropdown/OptionList'
import type { DropdownOption, TriggerAttrs } from './dropdown/types'
import { useDropdown } from './dropdown/useDropdown'

interface SingleSelectDropdownProps extends TriggerAttrs {
  /** Shown on the closed button when nothing (or the "any" option) is selected. */
  placeholder: string
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  triggerClassName?: string
}

/**
 * Single-select: a button plus a listbox right under it, since a native
 * `<select>`'s OS-drawn popup can open away from the field on mobile (ZEST-115).
 * Focus stays on the trigger; keys and typed letters move a virtual highlight.
 */
export function SingleSelectDropdown({
  placeholder,
  options,
  value,
  onChange,
  triggerClassName,
  ...triggerAttrs
}: SingleSelectDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const d = useDropdown(containerRef, options, value, onChange, triggerAttrs.disabled)

  return (
    <div ref={containerRef} onBlur={d.onBlur} className={`relative ${d.open ? 'z-dropdown' : ''}`}>
      <DropdownTrigger
        {...triggerAttrs}
        text={d.selected?.label ?? placeholder}
        isPlaceholder={!d.selected}
        flash={d.flash}
        onFlashEnd={() => d.setFlash(false)}
        className={triggerClassName}
        onClick={() => (d.open ? d.close() : d.openMenu())}
        onKeyDown={d.onKeyDown}
        aria-expanded={d.open}
        aria-controls={d.listboxId}
        aria-activedescendant={d.open ? d.optionId(d.activeIndex) : undefined}
      />
      {d.open && (
        <OptionList
          id={d.listboxId}
          {...{ options, value }}
          optionId={d.optionId}
          activeIndex={d.activeIndex}
          openUp={d.openUp}
          onHover={d.setActiveIndex}
          onSelect={d.select}
        />
      )}
    </div>
  )
}
