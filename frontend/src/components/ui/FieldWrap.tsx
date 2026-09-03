import type { ReactNode } from 'react'

interface FieldWrapProps {
  label?: string
  required?: boolean
  error?: string
  errorId: string
  htmlFor?: string
  className?: string
  children: ReactNode
}

/** Shared label/required-mark/error chrome for TextField, NumberField, SelectField and TextAreaField. */
export function FieldWrap({ label, required, error, errorId, htmlFor, className = '', children }: FieldWrapProps) {
  return (
    <label className={`flex flex-col gap-2 ${className}`} htmlFor={htmlFor}>
      {label && (
        <span className="text-sm font-semibold">
          {label}
          {required && <span className="text-error"> *</span>}
        </span>
      )}
      {children}
      {error && (
        <span id={errorId} className="text-sm text-error">
          {error}
        </span>
      )}
    </label>
  )
}
