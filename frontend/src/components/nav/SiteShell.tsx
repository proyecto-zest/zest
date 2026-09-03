import type { ReactNode } from 'react'
import { ToastProvider } from '../ui/toast'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { TopNav } from './TopNav'

interface SiteShellProps {
  children: ReactNode
}

/** Page shell: responsive nav (mobile bottom bar, desktop top bar) plus content column. */
export function SiteShell({ children }: SiteShellProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground">
        <MobileHeader />
        <TopNav />
        <main className="mx-auto max-w-content px-4 pb-nav-clearance-mobile pt-4 tablet:px-6 tablet:pb-12 tablet:pt-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </ToastProvider>
  )
}
