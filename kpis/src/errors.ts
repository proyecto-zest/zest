function describeOne(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    const name = error.name !== 'Error' ? error.name : '';
    const label = [name, typeof code === 'string' ? `(${code})` : ''].filter(Boolean).join(' ');

    return [label, error.message].filter(Boolean).join(': ') || error.constructor.name;
  }

  return String(error);
}

// pg wraps connection failures in an AggregateError with an empty message, so
// the useful text is in the inner errors. The result is never empty.
export function describeError(error: unknown): string {
  const outer = describeOne(error);

  if (error instanceof AggregateError && error.errors.length > 0) {
    const inner = [...new Set(error.errors.map(describeOne))].join('; ');
    return `${outer}: ${inner}`;
  }

  return outer === '' ? 'unknown error' : outer;
}
