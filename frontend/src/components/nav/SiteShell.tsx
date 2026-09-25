import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { ToastProvider } from '../ui/toast'
import { MobileHeader } from './MobileHeader'
import { TopNav } from './TopNav'

interface SiteShellProps {
  children: ReactNode
}

/** Routes that render full-bleed, without the app's own nav chrome. */
const chromelessRoutes = ['/login', '/signup']

/** Page shell: responsive nav (mobile header + drawer, desktop top bar) plus content column. */
export function SiteShell({ children }: SiteShellProps) {
  const { pathname } = useLocation()
  const chromeless = chromelessRoutes.includes(pathname)

  if (chromeless) {
    return <ToastProvider>{children}</ToastProvider>
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground">
        <MobileHeader />
        <TopNav />
        <main className="mx-auto max-w-content px-4 pb-12 pt-4 tablet:px-6 tablet:pt-8">{children}</main>
      </div>
    </ToastProvider>
  )
}
