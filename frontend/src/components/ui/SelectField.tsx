import { useId } from 'react'
import { FieldWrap } from './FieldWrap'
import { fieldInputClasses } from './fieldInputClasses'
import { SelectChevron } from './SelectChevron'

interface SelectFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  'aria-label'?: string
}

/** Labeled select with a fixed-position chevron instead of the browser's own. */
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  error,
  'aria-label': ariaLabel,
}: SelectFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <FieldWrap label={label} required={required} error={error} errorId={errorId} htmlFor={label ? id : undefined}>
      <div className="relative">
        <select
          id={label ? id : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          aria-label={label ? undefined : ariaLabel}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={fieldInputClasses(error, 'w-full appearance-none pr-10')}
        >
          <option value="" disabled>
            {placeholder ?? 'Select…'}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <SelectChevron />
      </div>
    </FieldWrap>
  )
}
