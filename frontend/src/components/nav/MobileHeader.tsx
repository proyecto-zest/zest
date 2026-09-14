import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Logo } from '../Logo'
import { MobileNavDrawer } from './MobileNavDrawer'
import { NewRecipeButton } from './NewRecipeButton'

/** Mobile top bar: logo/menu row. Search lives in the feed's filter panel, not here. */
export function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-nav flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur tablet:hidden">
        <NavLink to="/" aria-label="Zest home">
          <Logo />
        </NavLink>
        <div className="ml-auto flex items-center gap-3">
          <NewRecipeButton />
          <button type="button" aria-label="Open menu" onClick={() => setDrawerOpen(true)} className="text-foreground">
            <Menu aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
      </header>
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
