import { createContext, useContext } from 'react'
import type { AlertVariant } from '../../alert'

export interface ToastContextValue {
  showToast: (message: string, variant?: AlertVariant) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

/** Trigger a toast from anywhere under `<ToastProvider>` (mounted once in `SiteShell`). */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
