interface SelectFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

/** Labeled select. Label is optional for use inside repeated rows. */
export function SelectField({ label, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      {label && <span className="text-sm font-semibold">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3.5 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <option value="" disabled>
          {placeholder ?? 'Select…'}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
