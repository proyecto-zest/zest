interface NumberFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** Labeled numeric input. Value stays a string — parsed to a number on submit. */
export function NumberField({ label, value, onChange, placeholder }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder={placeholder}
        className="rounded-lg border border-input bg-background px-3.5 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
    </label>
  )
}
