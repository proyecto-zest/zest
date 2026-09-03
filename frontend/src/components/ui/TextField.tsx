import { useId } from 'react'
import { FieldWrap } from './FieldWrap'
import { fieldInputClasses } from './fieldInputClasses'

interface TextFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  'aria-label'?: string
}

/** Labeled single-line text input. Label is optional for use inside repeated rows. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  'aria-label': ariaLabel,
}: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <FieldWrap label={label} required={required} error={error} errorId={errorId} htmlFor={label ? id : undefined}>
      <input
        id={label ? id : undefined}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={fieldInputClasses(error)}
      />
    </FieldWrap>
  )
}
