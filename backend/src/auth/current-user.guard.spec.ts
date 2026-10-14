import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { AuthenticatedUser } from './authenticated-user.type';
import { CurrentUserGuard, RequestWithLocalUser } from './current-user.guard';

function contextWithRequest(
  request: Partial<RequestWithLocalUser>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('CurrentUserGuard', () => {
  const authenticatedUser: AuthenticatedUser = { sub: 'auth0|zest-user' };
  const localUser = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Zest Cook',
    avatarUrl: null,
  };

  it('attaches the local user to the request and allows the request through', async () => {
    const findByAuth0Sub = jest.fn().mockResolvedValue(localUser);
    const guard = new CurrentUserGuard({
      findByAuth0Sub,
    } as unknown as UsersService);
    const request: Partial<RequestWithLocalUser> = { user: authenticatedUser };

    await expect(guard.canActivate(contextWithRequest(request))).resolves.toBe(
      true,
    );
    expect(findByAuth0Sub).toHaveBeenCalledWith('auth0|zest-user');
    expect(request.localUser).toBe(localUser);
  });

  it('throws UnauthorizedException when no local user matches the token', async () => {
    const findByAuth0Sub = jest.fn().mockResolvedValue(null);
    const guard = new CurrentUserGuard({
      findByAuth0Sub,
    } as unknown as UsersService);
    const request: Partial<RequestWithLocalUser> = { user: authenticatedUser };

    await expect(
      guard.canActivate(contextWithRequest(request)),
    ).rejects.toThrow(UnauthorizedException);
  });
});
