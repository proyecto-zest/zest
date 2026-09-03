import { Home } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavLinkItem {
  to: string
  label: string
  icon: LucideIcon
  /** Passed straight to `NavLink`'s `end` — exact match for leaf routes, prefix match for sections. */
  end: boolean
}

/** Single source of tabs for both TopNav and BottomNav. Add entries here to grow the nav. */
export const navLinks: NavLinkItem[] = [{ to: '/', label: 'Feed', icon: Home, end: true }]
