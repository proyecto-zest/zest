import type { ReactNode } from 'react'

interface FieldWrapProps {
  label?: string
  required?: boolean
  error?: string
  /** Secondary note shown next to the error, e.g. a remaining-characters count. */
  hint?: string
  errorId: string
  htmlFor?: string
  /** Id for the label text, for controls that point at it with `aria-labelledby`. */
  labelId?: string
  className?: string
  children: ReactNode
}

/**
 * Shared label/required-mark/error/hint chrome for TextField, NumberField, SelectField and TextAreaField.
 * Only the label text is a `<label>`: wrapping the control would forward clicks on a select's open list to its trigger.
 */
export function FieldWrap({
  label,
  required,
  error,
  hint,
  errorId,
  htmlFor,
  labelId,
  className = '',
  children,
}: FieldWrapProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label id={labelId} htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}
      {children}
      {(error || hint) && (
        <div className="flex items-center justify-between gap-2 text-sm">
          {error && (
            <span id={errorId} className="text-error">
              {error}
            </span>
          )}
          {hint && <span className="ml-auto text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  )
}
