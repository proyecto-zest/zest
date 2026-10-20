import rules from './unaccent.json' with { type: 'json' }

const dictionary: Readonly<Record<string, string>> = rules

// Use the PostgreSQL unaccent dictionary, rather than NFD: NFD alone misses
// ligatures and letters such as ß, æ, ø and ł. See README.md in this directory.
export function normalizeSearchText(text: string): string {
  return Array.from(text, (character) => dictionary[character] ?? character)
    .join('')
    .toLowerCase()
}
