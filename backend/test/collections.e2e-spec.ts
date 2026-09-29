import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { CollectionsModule } from '../src/collections/collections.module';
import { configureApp } from '../src/configure-app';
import { PrismaModule } from '../src/prisma/prisma.module';
import { authTestConfigModuleOptions } from './auth-test-helper';
import {
  DEFAULT_TEST_AUTHENTICATED_USER,
  withAuthenticatedUser,
  withRejectedAuthentication,
} from './protected-route-test-helper';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('collections (e2e)', () => {
  const prisma = new PrismaClient();
  const validPayload = {
    name: 'Weeknight Dinners',
    coverImageUrl: 'https://images.test/cover.webp',
    accentColor: '#e8415a',
  };

  async function buildApp(): Promise<INestApplication> {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(authTestConfigModuleOptions()),
        PrismaModule,
        AuthModule,
        CollectionsModule,
      ],
    }).compile();

    const app = moduleFixture.createNestApplication();
    configureApp(app);

    return app;
  }

  async function createLocalUser(
    auth0Sub = DEFAULT_TEST_AUTHENTICATED_USER.sub,
  ) {
    return prisma.user.create({
      data: {
        auth0Sub,
        email: `${auth0Sub}@zest.test`,
        name: 'Zest Cook',
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

  describe('POST /collections', () => {
    it('creates a collection owned by the current user', async () => {
      await createLocalUser();
      const app = await buildApp();
      withAuthenticatedUser(app);
      await app.init();

      const response = await request(app.getHttpServer() as Server)
        .post('/collections')
        .send(validPayload)
        .expect(201);

      expect(response.body).toMatchObject(validPayload);
      expect(response.body).toHaveProperty('id');

      const stored = await prisma.collection.findUnique({
        where: { id: (response.body as { id: string }).id },
      });
      expect(stored).toMatchObject(validPayload);

      await app.close();
    });

    it('returns 401 without a token', async () => {
      const app = await buildApp();
      withRejectedAuthentication(app);
      await app.init();

      await request(app.getHttpServer() as Server)
        .post('/collections')
        .send(validPayload)
        .expect(401);

      await app.close();
    });

    it('returns 401 when the token is valid but no local User exists yet', async () => {
      const app = await buildApp();
      withAuthenticatedUser(app);
      await app.init();

      await request(app.getHttpServer() as Server)
        .post('/collections')
        .send(validPayload)
        .expect(401);

      await app.close();
    });

    it('rejects a body with unexpected fields', async () => {
      await createLocalUser();
      const app = await buildApp();
      withAuthenticatedUser(app);
      await app.init();

      await request(app.getHttpServer() as Server)
        .post('/collections')
        .send({ ...validPayload, description: 'not allowed' })
        .expect(400);

      await app.close();
    });

    it('rejects a missing name', async () => {
      await createLocalUser();
      const app = await buildApp();
      withAuthenticatedUser(app);
      await app.init();

      await request(app.getHttpServer() as Server)
        .post('/collections')
        .send({
          coverImageUrl: validPayload.coverImageUrl,
          accentColor: validPayload.accentColor,
        })
        .expect(400);

      await app.close();
    });

    it('rejects a non-hex accentColor', async () => {
      await createLocalUser();
      const app = await buildApp();
      withAuthenticatedUser(app);
      await app.init();

      await request(app.getHttpServer() as Server)
        .post('/collections')
        .send({ ...validPayload, accentColor: 'red' })
        .expect(400);

      await app.close();
    });
  });

  describe('DELETE /collections/:id', () => {
    it('deletes the collection and its collection_recipes rows, keeping the recipe', async () => {
      const owner = await createLocalUser();
      const recipe = await prisma.recipe.create({
        data: {
          authorId: owner.id,
          title: 'Test Recipe',
          description: 'Description',
          category: 'ALMUERZO',
          time: 20,
          timeUnit: 'MINUTOS',
          difficulty: 'FACIL',
          servings: 2,
        },
      });
      const collection = await prisma.collection.create({
        data: { ownerId: owner.id, ...validPayload },
      });
      await prisma.collectionRecipe.create({
        data: { collectionId: collection.id, recipeId: recipe.id },
      });

      const app = await buildApp();
      withAuthenticatedUser(app);
      await app.init();

      await request(app.getHttpServer() as Server)
        .delete(`/collections/${collection.id}`)
        .expect(204);

      expect(
        await prisma.collection.findUnique({ where: { id: collection.id } }),
      ).toBeNull();
      expect(
        await prisma.collectionRecipe.findUnique({
          where: {
            collectionId_recipeId: {
              collectionId: collection.id,
              recipeId: recipe.id,
            },
          },
        }),
      ).toBeNull();
      expect(
        await prisma.recipe.findUnique({ where: { id: recipe.id } }),
      ).not.toBeNull();

      await app.close();
    });

    it('lets a recipe still saved in a collection be deleted', async () => {
      const owner = await createLocalUser();
      const recipe = await prisma.recipe.create({
        data: {
          authorId: owner.id,
          title: 'Test Recipe',
          description: 'Description',
          category: 'ALMUERZO',
          time: 20,
          timeUnit: 'MINUTOS',
          difficulty: 'FACIL',
          servings: 2,
        },
      });
      const collection = await prisma.collection.create({
        data: { ownerId: owner.id, ...validPayload },
      });
      await prisma.collectionRecipe.create({
        data: { collectionId: collection.id, recipeId: recipe.id },
      });

      await expect(
        prisma.recipe.delete({ where: { id: recipe.id } }),
      ).resolves.toMatchObject({ id: recipe.id });

      expect(
        await prisma.collectionRecipe.findUnique({
          where: {
            collectionId_recipeId: {
              collectionId: collection.id,
              recipeId: recipe.id,
            },
          },
        }),
      ).toBeNull();
      expect(
        await prisma.collection.findUnique({ where: { id: collection.id } }),
      ).not.toBeNull();
    });

    it('returns 404 when the collection does not exist', async () => {
      await createLocalUser();
      const app = await buildApp();
      withAuthenticatedUser(app);
      await app.init();

      await request(app.getHttpServer() as Server)
        .delete('/collections/33333333-3333-4333-8333-333333333333')
        .expect(404);

      await app.close();
    });

    it("returns 403 when deleting another user's collection", async () => {
      await createLocalUser();
      const otherOwner = await createLocalUser('auth0|zest-other-owner');
      const collection = await prisma.collection.create({
        data: { ownerId: otherOwner.id, ...validPayload },
      });

      const app = await buildApp();
      withAuthenticatedUser(app);
      await app.init();

      await request(app.getHttpServer() as Server)
        .delete(`/collections/${collection.id}`)
        .expect(403);

      expect(
        await prisma.collection.findUnique({ where: { id: collection.id } }),
      ).not.toBeNull();

      await app.close();
    });

    it('returns 401 without a token', async () => {
      const owner = await createLocalUser();
      const collection = await prisma.collection.create({
        data: { ownerId: owner.id, ...validPayload },
      });

      const app = await buildApp();
      withRejectedAuthentication(app);
      await app.init();

      await request(app.getHttpServer() as Server)
        .delete(`/collections/${collection.id}`)
        .expect(401);

      await app.close();
    });
  });
});
