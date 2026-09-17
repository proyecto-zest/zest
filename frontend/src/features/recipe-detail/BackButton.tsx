import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * Returns to wherever the user came from (the feed at whatever page/filters
 * it had, search results, a collection) instead of always resetting to the
 * bare feed — `navigate(-1)` replays the browser history entry rather than
 * hardcoding a destination. Falls back to the feed when there's no history
 * to go back to (e.g. the recipe was opened from a shared link in a new tab).
 */
export function BackButton() {
  const navigate = useNavigate()

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      Back
    </button>
  )
}
