// The catalog picker only folds case and combining accents, including ñ/n.
// PostgreSQL may additionally transliterate ligatures and other characters.
export function normalizeSearchText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}
