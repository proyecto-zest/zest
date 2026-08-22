import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

/**
 * Mobile-first base layout: a single column on mobile, with the content
 * centered and capped as the viewport grows.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto w-full max-w-screen-lg px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold sm:text-2xl">Zest</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-lg flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto w-full max-w-screen-lg px-4 py-4 text-sm text-neutral-500 sm:px-6 lg:px-8">
          Zest — lab project
        </div>
      </footer>
    </div>
  )
}
