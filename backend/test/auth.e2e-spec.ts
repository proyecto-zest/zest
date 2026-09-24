jest.mock('jwks-rsa', () =>
  jest
    .requireActual<typeof import('./auth-test-helper')>('./auth-test-helper')
    .mockJwksModule(),
);

import { Controller, Get, INestApplication, Req } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { AuthenticatedUser } from '../src/auth/authenticated-user.type';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { Public } from '../src/auth/public.decorator';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  authTestConfigModuleOptions,
  createTestToken,
} from './auth-test-helper';

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

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(authTestConfigModuleOptions()),
        PrismaModule,
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
    })
      // AuthModule pulls in UsersModule (for CurrentUserGuard's UsersService
      // dependency), but this spec only exercises JwtAuthGuard/JwtStrategy —
      // it never touches the database, so a real PrismaService connection
      // is stubbed out rather than actually connecting.
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

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
      .set('Authorization', `Bearer ${createTestToken()}`)
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
      .set('Authorization', `Bearer ${createTestToken(overrides)}`)
      .expect(401)
      .expect((response) => {
        const body = response.body as { message: string };
        expect(body.message).toBe('Authentication token is invalid');
      });
  });

  it('reports an expired token clearly', async () => {
    await request(app.getHttpServer() as Server)
      .get('/auth-test/protected')
      .set('Authorization', `Bearer ${createTestToken({ expiresIn: -1 })}`)
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
