import { Plus } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { buttonClasses } from '../ui/buttonVariants'

/** Hidden while the create-recipe form itself is open — no point linking to the page you're on. */
export function NewRecipeButton() {
  const { pathname } = useLocation()
  if (pathname === '/recipes/new') return null

  return (
    <Link to="/recipes/new" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
      <Plus aria-hidden="true" className="h-4 w-4" />
      New recipe
    </Link>
  )
}
