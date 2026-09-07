export interface NavLinkItem {
  to: string
  label: string
  /** Passed straight to `NavLink`'s `end` — exact match for leaf routes, prefix match for sections. */
  end: boolean
}

/** Single source of tabs for both TopNav and the mobile drawer. Add entries here to grow the nav. */
export const navLinks: NavLinkItem[] = [{ to: '/', label: 'Feed', end: true }]
