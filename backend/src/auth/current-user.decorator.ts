import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { RequestWithLocalUser } from './current-user.guard';

/**
 * Resolves the request's local `User` row as a controller method parameter.
 * Requires `CurrentUserGuard` to run first (via `@UseGuards(CurrentUserGuard)`
 * on the controller or method) — that guard is what actually looks the row
 * up from the token's `sub` and attaches it as `request.localUser`; this
 * decorator only reads what the guard already resolved.
 *
 * Do not use this on `GET /users/me` — that endpoint creates the `User` row,
 * so requiring it to already exist would 401 every first-time caller before
 * the row is ever created.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithLocalUser>();

    return request.localUser;
  },
);
