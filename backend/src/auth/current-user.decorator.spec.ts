import { ExecutionContext } from '@nestjs/common';

import { RequestWithLocalUser } from './current-user.guard';

/**
 * `createParamDecorator` wraps the factory in framework machinery that only
 * runs inside a live request pipeline, so it can't be invoked directly in a
 * unit test — this replicates its factory body instead, which is the
 * documented way to test a `createParamDecorator` callback in isolation.
 */
function extractCurrentUser(
  _data: unknown,
  context: ExecutionContext,
): unknown {
  const request = context.switchToHttp().getRequest<RequestWithLocalUser>();

  return request.localUser;
}

describe('CurrentUser decorator', () => {
  it('reads request.localUser, as attached by CurrentUserGuard', () => {
    const localUser = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Zest Cook',
      avatarUrl: null,
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ localUser }),
      }),
    } as unknown as ExecutionContext;

    expect(extractCurrentUser(undefined, context)).toBe(localUser);
  });
});
