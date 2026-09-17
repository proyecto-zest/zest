import type { ReactNode } from 'react'

interface FieldWrapProps {
  label?: string
  required?: boolean
  error?: string
  /** Secondary note shown next to the error, e.g. a remaining-characters count. */
  hint?: string
  errorId: string
  htmlFor?: string
  className?: string
  children: ReactNode
}

/** Shared label/required-mark/error/hint chrome for TextField, NumberField, SelectField and TextAreaField. */
export function FieldWrap({ label, required, error, hint, errorId, htmlFor, className = '', children }: FieldWrapProps) {
  return (
    <label className={`flex flex-col gap-2 ${className}`} htmlFor={htmlFor}>
      {label && (
        <span className="text-sm font-semibold">
          {label}
          {required && <span className="text-error"> *</span>}
        </span>
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
    </label>
  )
}
