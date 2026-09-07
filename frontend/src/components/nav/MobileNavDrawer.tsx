import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { NavAvatar } from './NavAvatar'
import { navLinks } from './navLinks'

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
}

/**
 * Right-side slide-in menu for mobile, opened from the hamburger in
 * `MobileHeader`. Replaces a bottom tab bar: the prototype (`Zest.dc.html`)
 * explicitly removed that pattern in favor of this drawer. Closes on the "×"
 * button, Escape, backdrop click, or dragging the panel to the right.
 */
export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const setOffset = (px: number) => {
    if (panelRef.current) panelRef.current.style.transform = `translateX(${px}px)`
  }

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX
    setDragging(true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return
    setOffset(Math.max(0, e.clientX - dragStartX.current))
  }

  const endDrag = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return
    const dragged = Math.max(0, e.clientX - dragStartX.current)
    dragStartX.current = null
    setDragging(false)
    const panelWidth = panelRef.current?.offsetWidth ?? 0
    if (dragged > panelWidth * 0.33) {
      onClose()
    } else {
      setOffset(0)
    }
  }

  return (
    <div role="presentation" onClick={onClose} className="fixed inset-0 z-50 bg-foreground/45 tablet:hidden">
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ touchAction: 'pan-y' }}
        className={`absolute inset-y-0 right-0 flex w-4/5 max-w-xs flex-col gap-6 bg-background p-5 shadow-lg ${
          dragging ? '' : 'transition-transform duration-200'
        }`}
      >
        <button type="button" aria-label="Close menu" onClick={onClose} className="self-end text-muted-foreground">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>

        <nav aria-label="Main" className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                `rounded-xl px-3 py-3 text-lg font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
          <NavAvatar />
        </div>
      </div>
    </div>
  )
}
