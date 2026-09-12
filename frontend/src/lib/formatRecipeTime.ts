import { enumLabel } from './enumLabels'

/**
 * Renders a recipe's prep time with its unit (e.g. "25 min"). Falls back to
 * minutes when `timeUnit` is missing, so a response from before this field
 * existed still renders instead of showing a bare number.
 */
export const formatRecipeTime = (time: number, timeUnit?: string): string => `${time} ${enumLabel(timeUnit ?? 'MINUTOS')}`
