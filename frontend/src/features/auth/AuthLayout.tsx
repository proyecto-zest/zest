import type { ReactNode } from 'react'
import { Logo } from '../../components/Logo'

interface AuthLayoutProps {
  title: string
  children: ReactNode
}

/**
 * Split screen shared by `/login` and `/signup`: a gradient hero (hidden on
 * mobile, per the design's `showAuthHero`) and a centered card. Mirrors the
 * AUTH PAGE block in `support/design/zest/Zest.dc.html`, minus the mockup's
 * own email/password inputs — Auth0 Universal Login owns the actual form.
 */
export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen tablet:grid-cols-2">
      <div className="hidden flex-col items-center justify-center gap-5 bg-primary px-12 py-12 text-center text-primary-foreground tablet:flex">
        <img src="/zest-logo.png" alt="" className="h-16 w-16 object-contain" />
        <h1 className="font-serif text-4xl font-extrabold leading-tight">
          Cook brighter,
          <br />
          plan smarter.
        </h1>
        <p className="max-w-sm text-base leading-relaxed text-primary-foreground/90">
          Join thousands of home cooks sharing recipes, building collections, and planning delicious weeks — all in
          one zesty place.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-[420px] flex-col gap-6">
          <Logo className="justify-center" />

          <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-8">
            <div>
              <h2 className="text-center font-serif text-3xl font-extrabold">{title}</h2>
              <p className="mt-1.5 text-center text-sm text-muted-foreground">Cook brighter, plan smarter.</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
