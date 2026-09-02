interface TextAreaFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

/** Labeled multi-line text input. Label is optional for use inside repeated rows. */
export function TextAreaField({ label, value, onChange, placeholder, rows = 3 }: TextAreaFieldProps) {
  return (
    <label className="flex flex-1 flex-col gap-2">
      {label && <span className="text-sm font-semibold">{label}</span>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="min-w-0 flex-1 resize-none rounded-lg border border-input bg-background px-3.5 py-3 text-base leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
    </label>
  )
}
