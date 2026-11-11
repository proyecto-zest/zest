/** Room the open list needs: its `max-h-64` (256px) plus the gap and border. */
const LIST_SPACE = 272

/** True when the list should open above the trigger: no room below and more room above. */
export function shouldOpenUp(trigger: HTMLElement | null): boolean {
  if (!trigger) return false
  const rect = trigger.getBoundingClientRect()
  const below = window.innerHeight - rect.bottom
  return below < LIST_SPACE && rect.top > below
}
