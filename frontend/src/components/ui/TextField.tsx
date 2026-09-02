interface TextFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** Labeled single-line text input. Label is optional for use inside repeated rows. */
export function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      {label && <span className="text-sm font-semibold">{label}</span>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-input bg-background px-3.5 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
    </label>
  )
}
