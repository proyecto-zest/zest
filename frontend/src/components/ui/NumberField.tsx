import { useId } from 'react'
import { FieldWrap } from './FieldWrap'
import { fieldInputClasses } from './fieldInputClasses'

interface NumberFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  /** Allow one decimal point, for quantities like "1.5" instead of whole numbers only. */
  allowDecimal?: boolean
  'aria-label'?: string
}

const sanitize = (raw: string, allowDecimal?: boolean) => {
  if (!allowDecimal) return raw.replace(/\D/g, '')
  const [whole, ...rest] = raw.replace(/[^0-9.]/g, '').split('.')
  return rest.length > 0 ? `${whole}.${rest.join('')}` : whole
}

/** Labeled numeric input. Value stays a string — parsed to a number on submit. */
export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  allowDecimal,
  'aria-label': ariaLabel,
}: NumberFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <FieldWrap label={label} required={required} error={error} errorId={errorId} htmlFor={label ? id : undefined}>
      <input
        id={label ? id : undefined}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        pattern={allowDecimal ? '[0-9]*\\.?[0-9]*' : '[0-9]*'}
        value={value}
        onChange={(e) => onChange(sanitize(e.target.value, allowDecimal))}
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
