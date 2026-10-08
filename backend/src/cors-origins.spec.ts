import {
  buildCorsOriginMatcher,
  isValidCorsOrigin,
  parseCorsOrigins,
} from './cors-origins';

const PRODUCTION = 'https://zest-frontend-five.vercel.app';
const PREVIEW_PATTERN = 'https://zest-frontend-*-zest20.vercel.app';

function isAllowed(raw: string, origin: string | undefined): boolean {
  let allowed = false;
  buildCorsOriginMatcher(raw)(origin, (_error, allow) => {
    allowed = allow === true;
  });
  return allowed;
}

describe('parseCorsOrigins', () => {
  it('splits on commas, trims spaces and trailing slashes, and drops blanks', () => {
    expect(
      parseCorsOrigins(` ${PRODUCTION}/ , ,http://localhost:5173 `),
    ).toEqual([PRODUCTION, 'http://localhost:5173']);
  });
});

describe('isValidCorsOrigin', () => {
  it.each([
    PRODUCTION,
    'http://localhost:5173',
    PREVIEW_PATTERN,
    'https://zest-frontend-git-*-zest20.vercel.app',
  ])('accepts %s', (entry) => {
    expect(isValidCorsOrigin(entry)).toBe(true);
  });

  it.each([
    'localhost:5173',
    'https://*.vercel.app',
    'https://*',
    'https://zest-frontend.vercel.*',
    'https://zest-frontend.*.app',
    'https://zest.com/path',
    'ftp://zest.com',
  ])('rejects %s', (entry) => {
    expect(isValidCorsOrigin(entry)).toBe(false);
  });
});

describe('buildCorsOriginMatcher', () => {
  const raw = `${PRODUCTION},${PREVIEW_PATTERN}`;

  it('allows the exact production origin', () => {
    expect(isAllowed(raw, PRODUCTION)).toBe(true);
  });

  it.each([
    'https://zest-frontend-9f3k2abc-zest20.vercel.app',
    'https://zest-frontend-git-feature-login-zest20.vercel.app',
  ])('allows the preview origin %s', (origin) => {
    expect(isAllowed(raw, origin)).toBe(true);
  });

  it.each([
    'https://example.com',
    'https://zest-frontend-five.vercel.app.evil.com',
    'https://evil.com/zest-frontend-x-zest20.vercel.app',
    'https://zest-frontend-x.evil.com-zest20.vercel.app',
    'https://zest-frontend--zest20.vercel.app',
    'https://zest-frontend-x-other.vercel.app',
    'http://zest-frontend-x-zest20.vercel.app',
    'https://zest-frontend-five.vercel.app:8443',
  ])('rejects %s', (origin) => {
    expect(isAllowed(raw, origin)).toBe(false);
  });

  it('rejects requests without an Origin header', () => {
    expect(isAllowed(raw, undefined)).toBe(false);
  });
});
