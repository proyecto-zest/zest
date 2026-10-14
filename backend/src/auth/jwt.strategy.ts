import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

import {
  AUTH0_EMAIL_CLAIM,
  AUTH0_EMAIL_VERIFIED_CLAIM,
  AUTH0_NAME_CLAIM,
  AUTH0_PICTURE_CLAIM,
} from './auth.constants';
import { AuthenticatedUser } from './authenticated-user.type';

type Auth0JwtPayload = {
  sub: string;
  [AUTH0_EMAIL_CLAIM]?: string;
  [AUTH0_NAME_CLAIM]?: string;
  [AUTH0_PICTURE_CLAIM]?: string;
  [AUTH0_EMAIL_VERIFIED_CLAIM]?: boolean;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const domain = configService.getOrThrow<string>('AUTH0_DOMAIN');

    super({
      algorithms: ['RS256'],
      audience: configService.getOrThrow<string>('AUTH0_AUDIENCE'),
      ignoreExpiration: false,
      issuer: `https://${domain}/`,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
        rateLimit: true,
      }),
    });
  }

  validate(payload: Auth0JwtPayload): AuthenticatedUser {
    return {
      sub: payload.sub,
      email: payload[AUTH0_EMAIL_CLAIM],
      name: payload[AUTH0_NAME_CLAIM],
      picture: payload[AUTH0_PICTURE_CLAIM],
      emailVerified: payload[AUTH0_EMAIL_VERIFIED_CLAIM],
    };
  }
}
