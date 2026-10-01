import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonClasses } from '../../components/ui/buttonVariants'

/** Temporary destination until the collection detail screen is implemented in ZEST-94. */
export function CollectionDetailPlaceholder() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="font-serif text-3xl font-bold text-foreground">Collection</h1>
      <p className="text-muted-foreground">Collection details are not available yet.</p>
      <Link to="/collections" className={buttonClasses({ variant: 'secondary', size: 'md' })}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to My Collections
      </Link>
    </div>
  )
}
