import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { pageNumbers } from './pageNumbers'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

/** Numbered pagination: prev/next chevrons plus page buttons, eliding the middle for long lists. */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
      <Button variant="icon" aria-label="Previous page" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      </Button>

      {pageNumbers(page, totalPages).map((n, i) =>
        n === null ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={n}
            variant={n === page ? 'primary' : 'secondary'}
            size="sm"
            aria-current={n === page ? 'page' : undefined}
            onClick={() => onPageChange(n)}
          >
            {n}
          </Button>
        ),
      )}

      <Button
        variant="icon"
        aria-label="Next page"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </Button>
    </nav>
  )
}
