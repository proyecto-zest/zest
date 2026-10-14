import { Link } from 'react-router-dom'
import { UserX } from 'lucide-react'
import { buttonClasses } from '../../components/ui/buttonVariants'

/** Friendly 404 state for an unknown public profile. */
export function UserNotFound() {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-16 text-center">
      <UserX aria-hidden="true" className="h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 font-serif text-2xl font-bold text-foreground">User not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This profile does not exist or is no longer available.
      </p>
      <Link
        to="/"
        className={buttonClasses({ variant: 'secondary', size: 'md', className: 'mt-6' })}
      >
        Back to recipes
      </Link>
    </div>
  )
}
