jest.mock('jwks-rsa', () =>
  jest
    .requireActual<typeof import('./auth-test-helper')>('./auth-test-helper')
    .mockJwksModule(),
);

import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PrismaModule } from '../src/prisma/prisma.module';
import { CurrentUserResponseDto } from '../src/users/dto/current-user.dto';
import { UsersModule } from '../src/users/users.module';
import {
  authTestConfigModuleOptions,
  createTestToken,
} from './auth-test-helper';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('GET /users/me (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication;

  beforeAll(async () => {
    await prisma.$connect();

    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(authTestConfigModuleOptions()),
        AuthModule,
        PrismaModule,
        UsersModule,
      ],
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

  beforeEach(async () => {
    await resetTestDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('creates the User on first call, including avatarUrl from picture', async () => {
    const token = createTestToken({
      subject: 'auth0|zest-cook',
      email: 'cook@zest.test',
      name: 'Zest Cook',
      picture: 'https://images.test/cook.webp',
      emailVerified: true,
    });

    const response = await request(app.getHttpServer() as Server)
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const body = response.body as CurrentUserResponseDto;

    expect(body).toEqual({
      id: expect.any(String) as string,
      name: 'Zest Cook',
      email: 'cook@zest.test',
      emailVerified: true,
      avatarUrl: 'https://images.test/cook.webp',
    });

    const stored = await prisma.user.findUnique({
      where: { auth0Sub: 'auth0|zest-cook' },
    });
    expect(stored).toMatchObject({
      name: 'Zest Cook',
      email: 'cook@zest.test',
      emailVerified: true,
      avatarUrl: 'https://images.test/cook.webp',
    });
  });

  it('syncs email and emailVerified on later calls without duplicating the user', async () => {
    const firstToken = createTestToken({
      subject: 'auth0|zest-cook',
      email: 'old@zest.test',
      name: 'Zest Cook',
      emailVerified: false,
    });
    await request(app.getHttpServer() as Server)
      .get('/users/me')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);

    const secondToken = createTestToken({
      subject: 'auth0|zest-cook',
      email: 'new@zest.test',
      name: 'Zest Cook',
      emailVerified: true,
    });
    const response = await request(app.getHttpServer() as Server)
      .get('/users/me')
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      email: 'new@zest.test',
      emailVerified: true,
    });

    const users = await prisma.user.findMany({
      where: { auth0Sub: 'auth0|zest-cook' },
    });
    expect(users).toHaveLength(1);
  });

  it('keeps a name/avatarUrl edited in Zest across a later login with different token claims', async () => {
    const firstToken = createTestToken({
      subject: 'auth0|zest-cook',
      email: 'cook@zest.test',
      name: 'Zest Cook',
      picture: 'https://images.test/original.webp',
    });
    await request(app.getHttpServer() as Server)
      .get('/users/me')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);

    await prisma.user.update({
      where: { auth0Sub: 'auth0|zest-cook' },
      data: {
        name: 'Edited In Zest',
        avatarUrl: 'https://images.test/edited.webp',
      },
    });

    const secondToken = createTestToken({
      subject: 'auth0|zest-cook',
      email: 'cook@zest.test',
      name: 'Name From Auth0 Login',
      picture: 'https://images.test/from-auth0.webp',
    });
    const response = await request(app.getHttpServer() as Server)
      .get('/users/me')
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      name: 'Edited In Zest',
      avatarUrl: 'https://images.test/edited.webp',
    });
  });

  it('returns 401 when no token is provided', async () => {
    await request(app.getHttpServer() as Server)
      .get('/users/me')
      .expect(401);
  });

  it('returns 409 when the email is already used by a different auth0Sub', async () => {
    await prisma.user.create({
      data: {
        auth0Sub: 'auth0|zest-password-signup',
        email: 'shared@zest.test',
        name: 'Original Signup',
        emailVerified: true,
      },
    });

    const token = createTestToken({
      subject: 'auth0|zest-social-login',
      email: 'shared@zest.test',
      name: 'Social Login',
    });

    await request(app.getHttpServer() as Server)
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    const users = await prisma.user.findMany({
      where: { email: 'shared@zest.test' },
    });
    expect(users).toHaveLength(1);
    expect(users[0].auth0Sub).toBe('auth0|zest-password-signup');
  });
});
