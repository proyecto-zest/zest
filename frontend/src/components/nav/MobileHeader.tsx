import { NavLink } from 'react-router-dom'
import { Logo } from '../Logo'
import { NavAvatar } from './NavAvatar'
import { NewRecipeButton } from './NewRecipeButton'

/** Mobile top bar: logo, New recipe and the avatar placeholder. Tabs live in BottomNav. */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-nav flex h-nav-mobile items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur tablet:hidden">
      <NavLink to="/" aria-label="Zest home">
        <Logo />
      </NavLink>
      <div className="ml-auto flex items-center gap-3">
        <NewRecipeButton />
        <NavAvatar />
      </div>
    </header>
  )
}
