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
import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PrismaModule } from '../src/prisma/prisma.module';
import { UserResponseDto } from '../src/users/dto/user-response.dto';
import { UsersModule } from '../src/users/users.module';
import {
  authTestConfigModuleOptions,
  createTestToken,
} from './auth-test-helper';
import { resetTestDatabase } from './test-database';
import { createDefaultTestUser } from './test-users';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('GET /users/:id (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication;
  const authorizationHeader = `Bearer ${createTestToken()}`;

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
    await createDefaultTestUser(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('returns id, name and avatarUrl for an existing user', async () => {
    const otherUser = await prisma.user.create({
      data: {
        auth0Sub: 'auth0|zest-other-user',
        name: 'Carla Cocinera',
        email: 'carla@zest.local',
        emailVerified: true,
        avatarUrl: 'https://images.test/carla.webp',
      },
    });

    const response = await request(app.getHttpServer() as Server)
      .get(`/users/${otherUser.id}`)
      .set('Authorization', authorizationHeader)
      .expect(200);
    const body = response.body as UserResponseDto;

    expect(body).toEqual({
      id: otherUser.id,
      name: 'Carla Cocinera',
      avatarUrl: 'https://images.test/carla.webp',
    });
  });

  it('does not expose email, auth0Sub, emailVerified or any other user field', async () => {
    const otherUser = await prisma.user.create({
      data: {
        auth0Sub: 'auth0|zest-other-user',
        name: 'Carla Cocinera',
        email: 'carla@zest.local',
        emailVerified: true,
        avatarUrl: 'https://images.test/carla.webp',
      },
    });

    const response = await request(app.getHttpServer() as Server)
      .get(`/users/${otherUser.id}`)
      .set('Authorization', authorizationHeader)
      .expect(200);

    expect(Object.keys(response.body as object).sort()).toEqual([
      'avatarUrl',
      'id',
      'name',
    ]);
    expect(response.body).not.toHaveProperty('email');
    expect(response.body).not.toHaveProperty('auth0Sub');
    expect(response.body).not.toHaveProperty('emailVerified');
    expect(response.body).not.toHaveProperty('createdAt');
    expect(response.body).not.toHaveProperty('updatedAt');
  });

  it('returns 404 when the user does not exist', async () => {
    await request(app.getHttpServer() as Server)
      .get(`/users/${randomUUID()}`)
      .set('Authorization', authorizationHeader)
      .expect(404);
  });

  it('returns 400 when the user id is not a UUID', async () => {
    await request(app.getHttpServer() as Server)
      .get('/users/not-a-uuid')
      .set('Authorization', authorizationHeader)
      .expect(400);
  });

  it('returns 401 when no token is provided', async () => {
    const otherUser = await prisma.user.create({
      data: {
        auth0Sub: 'auth0|zest-other-user',
        name: 'Carla Cocinera',
        email: 'carla@zest.local',
        emailVerified: true,
      },
    });

    await request(app.getHttpServer() as Server)
      .get(`/users/${otherUser.id}`)
      .expect(401);
  });
});
