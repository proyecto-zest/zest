import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { configureApp } from '../src/configure-app';
import { PrismaModule } from '../src/prisma/prisma.module';
import { UsersModule } from '../src/users/users.module';
import { authTestConfigModuleOptions } from './auth-test-helper';
import {
  DEFAULT_TEST_AUTHENTICATED_USER,
  withAuthenticatedUser,
  withRejectedAuthentication,
} from './protected-route-test-helper';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('PATCH /users/me (e2e)', () => {
  const prisma = new PrismaClient();

  async function buildApp(): Promise<INestApplication> {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(authTestConfigModuleOptions()),
        PrismaModule,
        AuthModule,
        UsersModule,
      ],
    }).compile();

    const app = moduleFixture.createNestApplication();
    configureApp(app);

    return app;
  }

  async function createLocalUser(): Promise<{ id: string }> {
    return prisma.user.create({
      data: {
        auth0Sub: DEFAULT_TEST_AUTHENTICATED_USER.sub,
        email: DEFAULT_TEST_AUTHENTICATED_USER.email!,
        name: 'Original Name',
        emailVerified: true,
      },
    });
  }

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 401 without a token', async () => {
    const app = await buildApp();
    withRejectedAuthentication(app);
    await app.init();

    await request(app.getHttpServer() as Server)
      .patch('/users/me')
      .send({ name: 'New Name' })
      .expect(401);

    await app.close();
  });

  it('returns 401 when the token is valid but no local User exists yet', async () => {
    const app = await buildApp();
    withAuthenticatedUser(app);
    await app.init();

    await request(app.getHttpServer() as Server)
      .patch('/users/me')
      .send({ name: 'New Name' })
      .expect(401);

    await app.close();
  });

  it('updates the name and persists it', async () => {
    const localUser = await createLocalUser();
    const app = await buildApp();
    withAuthenticatedUser(app);
    await app.init();

    const response = await request(app.getHttpServer() as Server)
      .patch('/users/me')
      .send({ name: 'Nuevo Nombre' })
      .expect(200);

    expect(response.body).toMatchObject({
      id: localUser.id,
      name: 'Nuevo Nombre',
    });

    const stored = await prisma.user.findUnique({
      where: { id: localUser.id },
    });
    expect(stored?.name).toBe('Nuevo Nombre');

    await app.close();
  });

  it('rejects an empty or whitespace-only name with 400', async () => {
    await createLocalUser();
    const app = await buildApp();
    withAuthenticatedUser(app);
    await app.init();

    await request(app.getHttpServer() as Server)
      .patch('/users/me')
      .send({ name: '   ' })
      .expect(400);

    await app.close();
  });

  it('rejects a name longer than the maximum length with 400', async () => {
    await createLocalUser();
    const app = await buildApp();
    withAuthenticatedUser(app);
    await app.init();

    await request(app.getHttpServer() as Server)
      .patch('/users/me')
      .send({ name: 'a'.repeat(101) })
      .expect(400);

    await app.close();
  });

  it('rejects fields outside the whitelist and modifies nothing', async () => {
    const localUser = await createLocalUser();
    const app = await buildApp();
    withAuthenticatedUser(app);
    await app.init();

    await request(app.getHttpServer() as Server)
      .patch('/users/me')
      .send({
        name: 'Nuevo Nombre',
        email: 'hacked@zest.test',
        auth0Sub: 'auth0|hacked',
        avatarUrl: 'https://images.test/hacked.webp',
      })
      .expect(400);

    const stored = await prisma.user.findUnique({
      where: { id: localUser.id },
    });
    expect(stored).toMatchObject({
      name: 'Original Name',
      email: DEFAULT_TEST_AUTHENTICATED_USER.email,
      auth0Sub: DEFAULT_TEST_AUTHENTICATED_USER.sub,
    });

    await app.close();
  });

  it('an edited name survives a later GET /users/me re-sync', async () => {
    await createLocalUser();
    const app = await buildApp();
    withAuthenticatedUser(app);
    await app.init();

    await request(app.getHttpServer() as Server)
      .patch('/users/me')
      .send({ name: 'Edited In Zest' })
      .expect(200);

    const response = await request(app.getHttpServer() as Server)
      .get('/users/me')
      .expect(200);

    expect(response.body).toMatchObject({ name: 'Edited In Zest' });

    await app.close();
  });
});
