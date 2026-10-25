import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  PrismaClient,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';
import { Server } from 'node:http';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PlannerEntriesModule } from '../src/planner-entries/planner-entries.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { StorageService } from '../src/storage/storage.service';
import { authTestConfigModuleOptions } from './auth-test-helper';
import {
  DEFAULT_TEST_AUTHENTICATED_USER,
  withAuthenticatedUser,
} from './protected-route-test-helper';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('DELETE /planner/:id (e2e)', () => {
  const prisma = new PrismaClient();
  const missingId = '11111111-1111-4111-8111-111111111111';
  const storage = {
    getSignedReadUrl: jest.fn(),
    deleteObject: jest.fn(),
  };
  let app: INestApplication;
  let userId: string;
  let otherUserId: string;
  let recipeId: string;

  const remove = (id: string) =>
    request(app.getHttpServer() as Server).delete(`/planner/${id}`);

  const createEntry = (ownerId = userId, date = '2026-11-03') =>
    prisma.plannerEntry.create({
      data: {
        userId: ownerId,
        recipeId,
        date: new Date(`${date}T00:00:00.000Z`),
        quantity: 2,
      },
    });

  beforeAll(async () => {
    await prisma.$connect();
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(authTestConfigModuleOptions()),
        PrismaModule,
        PlannerEntriesModule,
      ],
    })
      .overrideProvider(StorageService)
      .useValue(storage)
      .compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    withAuthenticatedUser(app);
    await app.init();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await resetTestDatabase(prisma);
    userId = (
      await prisma.user.create({
        data: {
          auth0Sub: DEFAULT_TEST_AUTHENTICATED_USER.sub,
          email: 'planner-owner@zest.test',
          name: 'Planner Owner',
        },
      })
    ).id;
    otherUserId = (
      await prisma.user.create({
        data: {
          auth0Sub: 'auth0|planner-delete-other',
          email: 'planner-other@zest.test',
          name: 'Other Cook',
        },
      })
    ).id;
    recipeId = (
      await prisma.recipe.create({
        data: {
          authorId: otherUserId,
          title: 'Lemon chicken',
          description: 'Chicken with lemon and olive oil.',
          category: RecipeCategory.ALMUERZO,
          difficulty: RecipeDifficulty.FACIL,
          time: 20,
          timeUnit: RecipeTimeUnit.MINUTOS,
          servings: 2,
          images: { create: { s3Key: 'recipes/planner-delete.webp' } },
          steps: { create: { stepNumber: 1, text: 'Cook the chicken.' } },
        },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('deletes only the owned entry with an empty 204, preserving the recipe and other entries', async () => {
    const entry = await createEntry();
    const nextDay = await createEntry(userId, '2026-11-04');
    const otherUserEntry = await createEntry(otherUserId);

    const response = await remove(entry.id).expect(204);

    expect(response.text).toBe('');
    expect(
      await prisma.plannerEntry.findUnique({ where: { id: entry.id } }),
    ).toBeNull();
    expect(
      await prisma.plannerEntry.findMany({ select: { id: true } }),
    ).toEqual(
      expect.arrayContaining([{ id: nextDay.id }, { id: otherUserEntry.id }]),
    );
    expect(await prisma.plannerEntry.count()).toBe(2);
    const recipe = await prisma.recipe.findUniqueOrThrow({
      where: { id: recipeId },
      include: { images: true, steps: true },
    });
    expect(recipe.authorId).toBe(otherUserId);
    expect(recipe.images).toHaveLength(1);
    expect(recipe.steps).toHaveLength(1);
    expect(storage.getSignedReadUrl).not.toHaveBeenCalled();
    expect(storage.deleteObject).not.toHaveBeenCalled();
  });

  it('returns 404 for a nonexistent entry without changing any entries', async () => {
    const entry = await createEntry();
    await remove(missingId).expect(404);
    expect(
      await prisma.plannerEntry.findUnique({ where: { id: entry.id } }),
    ).toEqual(entry);
  });

  it('returns 403 for another user’s entry without deleting or modifying it', async () => {
    const entry = await createEntry(otherUserId);
    await remove(entry.id).expect(403);
    expect(
      await prisma.plannerEntry.findUnique({ where: { id: entry.id } }),
    ).toEqual(entry);
  });

  it('returns 400 for an invalid UUID without deleting entries', async () => {
    await createEntry();
    await remove('not-a-uuid').expect(400);
    expect(await prisma.plannerEntry.count()).toBe(1);
  });

  it('returns 404 when the same entry is deleted again', async () => {
    const entry = await createEntry();
    await remove(entry.id).expect(204);
    await remove(entry.id).expect(404);
  });

  it('handles concurrent deletion of the same entry without returning 500', async () => {
    const entry = await createEntry();
    const responses = await Promise.all([remove(entry.id), remove(entry.id)]);
    expect(responses.map(({ status }) => status).sort()).toEqual([204, 404]);
    expect(await prisma.plannerEntry.count()).toBe(0);
  });

  it('returns 401 when a valid token has no synchronized local user', async () => {
    const entry = await createEntry(otherUserId);
    await prisma.user.delete({ where: { id: userId } });
    await remove(entry.id).expect(401);
    expect(await prisma.plannerEntry.count()).toBe(1);
  });

  it('returns 401 without a token through the real global guard and preserves the entry', async () => {
    const entry = await createEntry();
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue(storage)
      .compile();
    const protectedApp = moduleFixture.createNestApplication();
    configureApp(protectedApp);
    await protectedApp.init();
    try {
      await request(protectedApp.getHttpServer() as Server)
        .delete(`/planner/${entry.id}`)
        .expect(401);
      expect(await prisma.plannerEntry.count()).toBe(1);
    } finally {
      await protectedApp.close();
    }
  });
});
