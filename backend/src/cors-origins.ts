const ORIGIN_ENTRY = /^https?:\/\/[a-z0-9*-]+(\.[a-z0-9*-]+)*(:\d+)?$/;
// `*` only stands for letters, digits and hyphens inside one hostname label,
// so a pattern can never match across a dot (no `evil.com` tricks).
const WILDCARD = '[a-z0-9-]+';

type OriginCallback = (error: Error | null, allow?: boolean) => void;

export function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin !== '');
}

// A wildcard is only accepted in labels before the last two (the registrable
// domain) and must keep some fixed text, so `https://*.vercel.app` is rejected.
export function isValidCorsOrigin(entry: string): boolean {
  if (!ORIGIN_ENTRY.test(entry)) {
    return false;
  }

  const host = entry.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
  const labels = host.split('.');

  return labels.every((label, index) => {
    if (!label.includes('*')) {
      return true;
    }
    return index < labels.length - 2 && label.replace(/\*/g, '') !== '';
  });
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildCorsOriginMatcher(
  raw: string,
): (origin: string | undefined, callback: OriginCallback) => void {
  const entries = parseCorsOrigins(raw);
  const exactOrigins = new Set(entries.filter((entry) => !entry.includes('*')));
  const patterns = entries
    .filter((entry) => entry.includes('*'))
    .map(
      (entry) =>
        new RegExp(`^${entry.split('*').map(escapeRegExp).join(WILDCARD)}$`),
    );

  return (origin, callback) => {
    const allowed =
      origin !== undefined &&
      (exactOrigins.has(origin) ||
        patterns.some((pattern) => pattern.test(origin)));

    callback(null, allowed);
  };
}
