import { useEffect, useState, type ReactNode } from 'react'
import { Alert, type AlertVariant } from '../../alert'
import { ToastContext } from './ToastContext'

interface ToastState {
  id: number
  variant: AlertVariant
  message: string
}

const AUTO_DISMISS_MS = 4000

/** Mounts once at the app root so a toast survives navigation (e.g. after a redirect on submit). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = (message: string, variant: AlertVariant = 'success') =>
    setToast({ id: Date.now(), variant, message })

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-50 flex justify-center tablet:inset-x-auto tablet:right-6">
          <div className="w-full max-w-sm">
            <Alert variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}
