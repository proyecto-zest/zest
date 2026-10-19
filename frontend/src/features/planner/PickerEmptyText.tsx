/** Centered muted line for a picker list with nothing to show. */
export function PickerEmptyText({ children }: { children: string }) {
  return <p className="my-5 break-words text-center text-sm text-muted-foreground">{children}</p>
}
