import type { ReactNode } from 'react'
import { AppHeader } from './AppHeader'

interface AppShellProps {
  children: ReactNode
}

/**
 * Mobile-first page shell: sticky header plus a centered, capped content
 * column. Follows `site-shell.tsx` in the design reference, which has no
 * footer.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-4 tablet:px-6 tablet:pt-8">{children}</main>
    </div>
  )
}
