interface LogoProps {
  className?: string
}

/** Wordmark used in the app header. Mirrors `logo.tsx` in the design reference. */
export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/zest-logo.png" alt="" className="h-9 w-9 object-contain" />
      <span className="font-serif text-2xl font-bold tracking-tight">Zest</span>
    </div>
  )
}
