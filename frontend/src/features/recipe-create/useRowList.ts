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

  /** Moves the row with id `draggedId` to sit just before the row with id `targetId`. */
  const reorder = (draggedId: string, targetId: string) =>
    setRows((prev) => {
      if (draggedId === targetId) return prev
      const dragged = prev.find((row) => row.id === draggedId)
      if (!dragged) return prev
      const withoutDragged = prev.filter((row) => row.id !== draggedId)
      const targetIndex = withoutDragged.findIndex((row) => row.id === targetId)
      if (targetIndex === -1) return prev
      return [...withoutDragged.slice(0, targetIndex), dragged, ...withoutDragged.slice(targetIndex)]
    })

  return { rows, add, remove, update, reorder, reset: () => setRows(initial) }
}
