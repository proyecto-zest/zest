import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

export type SearchField = 'name' | 'author'

interface RecipeSearchFieldProps {
  field: SearchField
  onFieldChange: (field: SearchField) => void
  availableFields: SearchField[]
  value: string
  onChange: (value: string) => void
}

const DEBOUNCE_MS = 300

/** One search bar with the criterion selector from the feed design. */
export function RecipeSearchField({
  field,
  onFieldChange,
  availableFields,
  value,
  onChange,
}: RecipeSearchFieldProps) {
  const [draft, setDraft] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setDraft(value)
  }

  // Keep the latest callback when another filter changes during the debounce.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onChangeRef.current(draft), DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const switchField = (nextField: SearchField) => {
    // Switching remounts this input. Commit any text still in its debounce first.
    if (draft !== value) onChangeRef.current(draft)
    onFieldChange(nextField)
  }

  const label = field === 'author' ? 'Author' : 'Recipe'

  return (
    <div className="flex h-11 w-full min-w-0 items-center rounded-full border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring/50 tablet:min-w-64 tablet:flex-1">
      <Search aria-hidden="true" className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
      {availableFields.length > 1 ? (
        <select
          aria-label="Search by"
          value={field}
          onChange={(event) => switchField(event.target.value as SearchField)}
          className="max-w-24 shrink-0 cursor-pointer bg-transparent text-sm font-semibold text-foreground outline-none"
        >
          {availableFields.includes('name') && <option value="name">Recipe</option>}
          {availableFields.includes('author') && <option value="author">Author</option>}
        </select>
      ) : (
        <span className="shrink-0 text-sm font-semibold text-foreground">{label}</span>
      )}
      <span aria-hidden="true" className="mx-3 h-5 w-px shrink-0 bg-border" />
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={field === 'author' ? 'Search authors…' : 'Search recipes…'}
        aria-label={field === 'author' ? 'Search recipes by author' : 'Search recipes by name'}
        className="min-w-0 flex-1 bg-transparent py-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
      />
      {draft && (
        <button
          type="button"
          aria-label={field === 'author' ? 'Clear author filter' : 'Clear recipe name filter'}
          onClick={() => {
            setDraft('')
            onChangeRef.current('')
          }}
          className="ml-1 shrink-0 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
