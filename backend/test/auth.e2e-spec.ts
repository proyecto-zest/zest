import { Controller, Get, INestApplication, Req } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { generateKeyPairSync, KeyObject } from 'node:crypto';
import { Server } from 'node:http';
import { sign } from 'jsonwebtoken';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import {
  AUTH0_EMAIL_CLAIM,
  AUTH0_EMAIL_VERIFIED_CLAIM,
  AUTH0_NAME_CLAIM,
  AUTH0_PICTURE_CLAIM,
} from '../src/auth/auth.constants';
import { AuthenticatedUser } from '../src/auth/authenticated-user.type';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { Public } from '../src/auth/public.decorator';

let mockPublicKey = '';

jest.mock('jwks-rsa', () => ({
  passportJwtSecret:
    () =>
    (
      _request: unknown,
      _rawJwtToken: string,
      done: (error: Error | null, secret?: string) => void,
    ) =>
      done(null, mockPublicKey),
}));

const TEST_DOMAIN = 'auth-test.example.com';
const TEST_AUDIENCE = 'https://api.zest.test';
const TEST_ISSUER = `https://${TEST_DOMAIN}/`;

@Controller('auth-test')
class AuthTestController {
  @Get('protected')
  protected(@Req() requestValue: { user: AuthenticatedUser }) {
    return requestValue.user;
  }

  @Public()
  @Get('public')
  public() {
    return { status: 'ok' };
  }
}

describe('Auth0 JWT guard (e2e)', () => {
  let app: INestApplication;
  let privateKey: KeyObject;

  const createToken = (overrides?: {
    audience?: string;
    expiresIn?: number;
    issuer?: string;
  }): string =>
    sign(
      {
        [AUTH0_EMAIL_CLAIM]: 'cook@zest.test',
        [AUTH0_NAME_CLAIM]: 'Zest Cook',
        [AUTH0_PICTURE_CLAIM]: 'https://images.test/cook.webp',
        [AUTH0_EMAIL_VERIFIED_CLAIM]: true,
      },
      privateKey,
      {
        algorithm: 'RS256',
        audience: overrides?.audience ?? TEST_AUDIENCE,
        expiresIn: overrides?.expiresIn ?? 300,
        issuer: overrides?.issuer ?? TEST_ISSUER,
        subject: 'auth0|zest-user',
      },
    );

  beforeAll(async () => {
    const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    privateKey = keyPair.privateKey;
    mockPublicKey = keyPair.publicKey.export({
      format: 'pem',
      type: 'spki',
    }) as string;

    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [
            () => ({
              AUTH0_AUDIENCE: TEST_AUDIENCE,
              AUTH0_DOMAIN: TEST_DOMAIN,
            }),
          ],
        }),
        AuthModule,
      ],
      controllers: [AuthTestController],
      providers: [
        JwtAuthGuard,
        {
          provide: APP_GUARD,
          useExisting: JwtAuthGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 with a clear message when the token is missing', async () => {
    await request(app.getHttpServer() as Server)
      .get('/auth-test/protected')
      .expect(401)
      .expect((response) => {
        const body = response.body as { message: string };
        expect(body.message).toBe('Authentication token is required');
      });
  });

  it('accepts a valid token and exposes sub and custom claims', async () => {
    await request(app.getHttpServer() as Server)
      .get('/auth-test/protected')
      .set('Authorization', `Bearer ${createToken()}`)
      .expect(200)
      .expect({
        sub: 'auth0|zest-user',
        email: 'cook@zest.test',
        name: 'Zest Cook',
        picture: 'https://images.test/cook.webp',
        emailVerified: true,
      });
  });

  it.each([
    ['audience', { audience: 'https://wrong-audience.test' }],
    ['issuer', { issuer: 'https://wrong-issuer.test/' }],
  ])('rejects a token with an incorrect %s', async (_claim, overrides) => {
    await request(app.getHttpServer() as Server)
      .get('/auth-test/protected')
      .set('Authorization', `Bearer ${createToken(overrides)}`)
      .expect(401)
      .expect((response) => {
        const body = response.body as { message: string };
        expect(body.message).toBe('Authentication token is invalid');
      });
  });

  it('reports an expired token clearly', async () => {
    await request(app.getHttpServer() as Server)
      .get('/auth-test/protected')
      .set('Authorization', `Bearer ${createToken({ expiresIn: -1 })}`)
      .expect(401)
      .expect((response) => {
        const body = response.body as { message: string };
        expect(body.message).toBe('Authentication token has expired');
      });
  });

  it('allows a public route without a token', async () => {
    await request(app.getHttpServer() as Server)
      .get('/auth-test/public')
      .expect(200)
      .expect({ status: 'ok' });
  });
});
