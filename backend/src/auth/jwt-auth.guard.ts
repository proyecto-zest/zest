import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
    }>();

    if (!request.headers.authorization) {
      throw new UnauthorizedException('Authentication token is required');
    }

    return super.canActivate(context);
  }

  handleRequest<TUser>(
    error: Error | null,
    user: TUser | false | null,
    info?: Error,
  ): TUser {
    if (error) {
      throw error;
    }

    if (!user) {
      const message =
        info?.name === 'TokenExpiredError'
          ? 'Authentication token has expired'
          : 'Authentication token is invalid';

      throw new UnauthorizedException(message);
    }

    return user;
  }
}
