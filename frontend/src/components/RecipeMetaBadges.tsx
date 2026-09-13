import { Clock, Users } from 'lucide-react'
import { enumLabel } from '../lib/enumLabels'
import { recipeMetaBadgeClasses, type RecipeMetaBadgesSize } from './recipeMetaBadgesVariants'

interface RecipeMetaBadgesProps {
  category: string
  difficulty: string
  time: number
  /** Omitted where the backend doesn't send it (e.g. `RecipeCard`'s list projection) — the badge then shows the number alone. */
  timeUnit?: string
  servings: number
  /** `sm` for `RecipeCard`, `lg` for the recipe detail header. Defaults to `sm`. */
  size?: RecipeMetaBadgesSize
}

/**
 * Category, difficulty, time and servings as a row of pills — the single
 * place this info renders, shared by `RecipeCard` and the recipe detail page.
 * `category`/`difficulty` arrive as raw backend enum values (e.g. `POSTRE`);
 * `enumLabel` maps them to what the user sees.
 */
export function RecipeMetaBadges({ category, difficulty, time, timeUnit, servings, size = 'sm' }: RecipeMetaBadgesProps) {
  const classes = recipeMetaBadgeClasses[size]

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={classes.chip}>{enumLabel(category)}</span>
      <span className={classes.chip}>{enumLabel(difficulty)}</span>
      <span className={classes.chip}>
        <Clock aria-hidden="true" className={classes.icon} />
        {time}
        {timeUnit ? ` ${enumLabel(timeUnit)}` : null}
      </span>
      <span className={classes.chip}>
        <Users aria-hidden="true" className={classes.icon} />
        {servings}
      </span>
    </div>
  )
}
