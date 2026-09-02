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

  return { rows, add, remove, update, reset: () => setRows(initial) }
}
