import { useId } from 'react'
import { FieldWrap } from './FieldWrap'
import { fieldInputClasses } from './fieldInputClasses'

interface TextAreaFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  required?: boolean
  disabled?: boolean
  error?: string
  'aria-label'?: string
}

/** Labeled multi-line text input. Label is optional for use inside repeated rows. */
export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
  disabled,
  error,
  'aria-label': ariaLabel,
}: TextAreaFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <FieldWrap
      label={label}
      required={required}
      error={error}
      errorId={errorId}
      htmlFor={label ? id : undefined}
      className="flex-1"
    >
      <textarea
        id={label ? id : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={fieldInputClasses(error, 'min-w-0 flex-1 resize-none leading-relaxed')}
      />
    </FieldWrap>
  )
}
