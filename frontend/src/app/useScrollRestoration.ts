import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** Scroll position per route (pathname + search). Lives for the whole SPA session. */
const scrollPositions = new Map<string, number>()

/**
 * Makes in-app navigation feel like the browser's native back/forward:
 * a new navigation (PUSH/REPLACE, e.g. opening a recipe) starts at the top,
 * while going back (POP) restores the scroll position the page had when you
 * left it. The browser's own scroll restoration is turned off so it doesn't
 * fight with this.
 */
export function useScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const routeKey = location.pathname + location.search
  const routeKeyRef = useRef(routeKey)

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const onScroll = () => scrollPositions.set(routeKeyRef.current, window.scrollY)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    routeKeyRef.current = routeKey

    if (navigationType !== 'POP') {
      window.scrollTo(0, 0)
      return
    }

    const saved = scrollPositions.get(routeKey) ?? 0
    window.scrollTo(0, saved)
    if (window.scrollY >= saved) return

    // The page is still shorter than `saved` — its content (e.g. the feed's
    // async fetch) hasn't finished growing yet, so the scroll above got
    // clamped short. Keep nudging it back down as the page grows, until it
    // reaches the saved position or a couple of seconds pass (e.g. the fetch
    // failed and the page never gets that tall).
    const deadline = Date.now() + 2000
    const observer = new ResizeObserver(() => {
      window.scrollTo(0, saved)
      if (window.scrollY >= saved || Date.now() > deadline) observer.disconnect()
    })
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [routeKey, navigationType])
}
