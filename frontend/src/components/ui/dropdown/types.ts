import type { ComponentPropsWithoutRef } from 'react'

export interface DropdownOption {
  value: string
  label: string
}

/** Attributes `SingleSelectDropdown` forwards to its trigger button. */
export type TriggerAttrs = Pick<
  ComponentPropsWithoutRef<'button'>,
  | 'id'
  | 'disabled'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-invalid'
  | 'aria-describedby'
  | 'aria-required'
>
