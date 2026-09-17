interface AlertMessageProps {
  message: string | string[]
}

/**
 * Renders one message or several. A list is what validation errors look like,
 * so both shapes live here rather than forcing callers to branch.
 *
 * `break-words` keeps a long unbroken string (a URL, a stack trace) from pushing
 * the container wider than its column.
 */
export function AlertMessage({ message }: AlertMessageProps) {
  if (typeof message === 'string') {
    return <p className="break-words">{message}</p>
  }

  if (message.length === 1) {
    return <p className="break-words">{message[0]}</p>
  }

  return (
    <ul className="list-disc space-y-1 pl-5">
      {message.map((line) => (
        <li key={line} className="break-words">
          {line}
        </li>
      ))}
    </ul>
  )
}
