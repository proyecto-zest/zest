import { useId } from 'react'
import { FieldWrap } from './FieldWrap'
import { fieldInputClasses } from './fieldInputClasses'
import { SingleSelectDropdown } from './SingleSelectDropdown'

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

/**
 * Labeled select. Built on `SingleSelectDropdown` rather than a native
 * `<select>`, so the options always open right under the field, on mobile too.
 */
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
  const fieldId = label ? id : undefined

  return (
    <FieldWrap {...{ label, required, error, errorId }} htmlFor={fieldId} labelId={`${id}-label`}>
      <SingleSelectDropdown
        id={fieldId}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder ?? 'Select…'}
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        // Label text plus the trigger's own text ("Category *, Dinner"), not the
        // whole <label>, which also holds the open options and the error.
        aria-labelledby={label ? `${id}-label ${id}` : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        triggerClassName={fieldInputClasses(
          error,
          'flex w-full items-center justify-between gap-2 text-left text-foreground',
        )}
      />
    </FieldWrap>
  )
}
