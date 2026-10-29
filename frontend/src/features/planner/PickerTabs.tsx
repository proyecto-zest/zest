export type PickerTab = 'recipes' | 'collections'

const tabs: { id: PickerTab; label: string }[] = [
  { id: 'recipes', label: 'Recipes' },
  { id: 'collections', label: 'Collections' },
]

interface PickerTabsProps {
  active: PickerTab
  onChange: (tab: PickerTab) => void
}

/** Plain toggle buttons: two lists don't need the full tabs pattern (tabpanel, aria-controls, arrow keys). */
export function PickerTabs({ active, onChange }: PickerTabsProps) {
  return (
    <div role="group" aria-label="Pick from" className="flex gap-2 px-6 pt-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active === tab.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
