import { useState } from 'react'

/**
 * Add/remove/update for a list of rows keyed by `id`. Ingredients and steps
 * need identical CRUD logic, so it lives here once instead of twice.
 */
export function useRowList<T extends { id: string }>(initial: T[], makeRow: () => T) {
  const [rows, setRows] = useState<T[]>(initial)

  const add = () => setRows((prev) => [...prev, makeRow()])

  const remove = (id: string) => setRows((prev) => prev.filter((row) => row.id !== id))

  const update = (id: string, patch: Partial<T>) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))

  /** Moves the row with id `draggedId` into the slot the row with id `targetId` occupies. */
  const reorder = (draggedId: string, targetId: string) =>
    setRows((prev) => {
      const from = prev.findIndex((row) => row.id === draggedId)
      const to = prev.findIndex((row) => row.id === targetId)
      if (from === -1 || to === -1 || from === to) return prev
      const next = [...prev]
      const [dragged] = next.splice(from, 1)
      next.splice(to, 0, dragged)
      return next
    })

  return { rows, add, remove, update, reorder, reset: () => setRows(initial) }
}
