import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { AuthenticatedUser } from './authenticated-user.type';

export type RequestWithLocalUser = {
  user: AuthenticatedUser;
  localUser: Awaited<ReturnType<UsersService['findByAuth0Sub']>>;
};

/**
 * Runs after the global `JwtAuthGuard` and resolves the validated token's
 * `sub` to a local `User` row, attaching it as `request.localUser` for
 * `@CurrentUser()` to read. A valid token with no matching local `User`
 * means the frontend hasn't called `GET /users/me` yet (that's the endpoint
 * that creates the row) — reported as 401, not 404, since from the caller's
 * point of view they simply aren't authenticated into the app yet.
 */
@Injectable()
export class CurrentUserGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithLocalUser>();
    const localUser = await this.usersService.findByAuth0Sub(request.user.sub);

    if (!localUser) {
      throw new UnauthorizedException(
        'No local account for this token yet — call GET /users/me first',
      );
    }

    request.localUser = localUser;

    return true;
  }
}
