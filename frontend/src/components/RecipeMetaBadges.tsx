import { Clock, Gauge, Users } from 'lucide-react'
import { enumLabel } from '../lib/enumLabels'
import { recipeMetaBadgeClasses, type RecipeMetaBadgesSize } from './recipeMetaBadgesVariants'

interface RecipeMetaBadgesProps {
  category: string
  difficulty: string
  time: number
  /** Omitted where the backend doesn't send it (e.g. `RecipeCard`'s list projection) — the time box then shows the number alone. */
  timeUnit?: string
  servings: number
  /** `sm` for `RecipeCard`, `lg` for the recipe detail header — per `support/design/uploads/zest-wireframe-design/components/recipe-detail.tsx`. */
  size?: RecipeMetaBadgesSize
}

/**
 * The recipe's category chip plus Time/Level/Servings meta boxes — the single
 * place this info renders, shared by `RecipeCard` and the recipe detail page.
 * `category`/`difficulty` arrive as raw backend enum values (e.g. `POSTRE`);
 * `enumLabel` maps them to what the user sees.
 */
export function RecipeMetaBadges({ category, difficulty, time, timeUnit, servings, size = 'sm' }: RecipeMetaBadgesProps) {
  const classes = recipeMetaBadgeClasses[size]

  return (
    <div className="flex flex-col gap-3">
      <span className={classes.categoryChip}>{enumLabel(category)}</span>

      <div className="grid grid-cols-3 gap-3">
        <div className={classes.box}>
          <Clock aria-hidden="true" className={`mx-auto mb-1 ${classes.icon} text-primary`} />
          <p className={classes.value}>
            {time}
            {timeUnit ? ` ${enumLabel(timeUnit)}` : null}
          </p>
          <p className={classes.label}>Time</p>
        </div>

        <div className={classes.box}>
          <Gauge aria-hidden="true" className={`mx-auto mb-1 ${classes.icon} text-success`} />
          <p className={classes.value}>{enumLabel(difficulty)}</p>
          <p className={classes.label}>Level</p>
        </div>

        <div className={classes.box}>
          <Users aria-hidden="true" className={`mx-auto mb-1 ${classes.icon} text-accent`} />
          <p className={classes.value}>{servings}</p>
          <p className={classes.label}>Servings</p>
        </div>
      </div>
    </div>
  )
}
