/**
 * Which page buttons to show: first, last, and current ±1, with `null`
 * marking an elided gap. Pure so the layout can be reasoned about (and
 * tested) without rendering anything.
 */
export function pageNumbers(current: number, total: number): Array<number | null> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const candidates = [1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total)
  const pages = [...new Set(candidates)].sort((a, b) => a - b)

  const result: Array<number | null> = []
  pages.forEach((page, i) => {
    if (i > 0 && page - pages[i - 1] > 1) result.push(null)
    result.push(page)
  })
  return result
}
