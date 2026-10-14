export type ProfileTab = 'recipes' | 'collections' | 'settings'

interface ProfileTabsProps {
  activeTab: ProfileTab
  onChange: (tab: ProfileTab) => void
}

const tabs: { id: ProfileTab; label: string }[] = [
  { id: 'recipes', label: 'My recipes' },
  { id: 'collections', label: 'Collections' },
  { id: 'settings', label: 'Settings' },
]

/** Compact tab switcher that stays usable at narrow mobile widths. */
export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  return (
    <div
      className="flex overflow-x-auto border-b border-border"
      role="tablist"
      aria-label="Profile content"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={`shrink-0 border-b-2 px-4 pb-3 text-sm transition-colors ${
            activeTab === tab.id
              ? 'border-primary font-semibold text-foreground'
              : 'border-transparent font-medium text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
