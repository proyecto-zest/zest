import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthenticatedUser } from '../src/auth/authenticated-user.type';

export const DEFAULT_TEST_AUTHENTICATED_USER: AuthenticatedUser = {
  sub: 'auth0|zest-test-user',
  email: 'cook@zest.test',
  name: 'Zest Cook',
  picture: 'https://images.test/cook.webp',
  emailVerified: true,
};

/**
 * Replaces the global `JwtAuthGuard` on an already-created `INestApplication`
 * so protected routes work without signing a real JWT or reaching out to
 * Auth0's JWKS endpoint — the fast path for any ticket that just needs "a
 * request from an authenticated user", not a test of the guard/JWT-validation
 * machinery itself (for that, see `auth-test-helper.ts`, which signs real
 * tokens against a mocked JWKS).
 *
 * Uses `app.useGlobalGuards(...)` rather than `TestingModuleBuilder
 * .overrideGuard(JwtAuthGuard)` / `.overrideProvider(APP_GUARD)` — both
 * unreliably fail to actually replace a guard registered via the `APP_GUARD`
 * token in this Nest version (confirmed by direct reproduction: the real
 * `JwtAuthGuard` kept running under either override, no error, just silently
 * ignored). `useGlobalGuards` after `createNestApplication()` is the
 * confirmed-working alternative.
 *
 * Must be called after `moduleFixture.createNestApplication()` and before
 * `app.init()`:
 *
 *   const app = moduleFixture.createNestApplication();
 *   withAuthenticatedUser(app);
 *   await app.init();
 */
export function withAuthenticatedUser(
  app: INestApplication,
  authenticatedUser: AuthenticatedUser = DEFAULT_TEST_AUTHENTICATED_USER,
): void {
  app.useGlobalGuards({
    canActivate: (context: ExecutionContext) => {
      const request = context
        .switchToHttp()
        .getRequest<{ user: AuthenticatedUser }>();
      request.user = authenticatedUser;

      return true;
    },
  } satisfies CanActivate);
}

/**
 * Replaces the global `JwtAuthGuard` on an already-created `INestApplication`
 * to reject every request the way a missing/invalid token would (401),
 * without a real guard evaluating anything — use this to assert a route's
 * 401 behavior without needing a malformed token to trigger it. Throws
 * `UnauthorizedException` explicitly: a guard that merely returns `false`
 * gets Nest's generic 403 Forbidden, not the 401 a real auth failure
 * produces. See `withAuthenticatedUser` above for why this takes the app
 * instance rather than the `TestingModuleBuilder`.
 */
export function withRejectedAuthentication(
  app: INestApplication,
  message = 'Authentication token is required',
): void {
  app.useGlobalGuards({
    canActivate: () => {
      throw new UnauthorizedException(message);
    },
  } satisfies CanActivate);
}
