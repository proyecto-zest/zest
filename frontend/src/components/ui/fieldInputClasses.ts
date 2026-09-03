/** Shared input/select/textarea chrome for the ui/ form fields. */
export function fieldInputClasses(error?: string, extra = ''): string {
  return `rounded-lg border bg-background px-3.5 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60 ${
    error ? 'border-error' : 'border-input'
  } ${extra}`.trim()
}
