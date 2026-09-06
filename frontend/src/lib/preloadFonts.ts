import playfairDisplayUrl from '@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2?url'

/**
 * Preloads the serif font used for headings and card titles. Without this,
 * the browser paints text in a fallback font first and swaps once the
 * variable font downloads (`font-display: swap`), causing a visible reflow —
 * most noticeable on recipe card titles right after a hard reload.
 */
export function preloadFonts() {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'font'
  link.type = 'font/woff2'
  link.crossOrigin = 'anonymous'
  link.href = playfairDisplayUrl
  document.head.appendChild(link)
}
