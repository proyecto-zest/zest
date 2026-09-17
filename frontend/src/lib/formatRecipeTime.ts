import { enumLabel } from './enumLabels'

/**
 * Renders a recipe's prep time with its unit (e.g. "25 min"). `timeUnit` is
 * always sent by the API (ZEST-83); the `?? 'MINUTOS'` fallback is just a
 * safety net, not something normally reachable.
 */
export const formatRecipeTime = (time: number, timeUnit: string): string => `${time} ${enumLabel(timeUnit ?? 'MINUTOS')}`
