import type { ReactNode } from 'react'
import { ToastProvider } from '../ui/toast'
import { MobileHeader } from './MobileHeader'
import { TopNav } from './TopNav'

interface SiteShellProps {
  children: ReactNode
}

/** Page shell: responsive nav (mobile header + drawer, desktop top bar) plus content column. */
export function SiteShell({ children }: SiteShellProps) {
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
