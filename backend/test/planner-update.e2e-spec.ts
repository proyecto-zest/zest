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

describeWithDatabase('PATCH /planner/:id (e2e)', () => {
  const prisma = new PrismaClient();
  const imageKey = 'recipes/planner-update-first.webp';
  const getSignedReadUrl = jest.fn((key: string) =>
    Promise.resolve(`https://signed.test/${key}`),
  );
  let app: INestApplication;
  let userId: string;
  let otherUserId: string;
  let recipeId: string;
  let entryId: string;

  const patch = (body: Record<string, unknown>, id = entryId) =>
    request(app.getHttpServer() as Server)
      .patch(`/planner/${id}`)
      .send(body);

  const readEntry = () =>
    prisma.plannerEntry.findUniqueOrThrow({ where: { id: entryId } });

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
      .useValue({ getSignedReadUrl })
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
          email: 'planner-editor@zest.test',
          name: 'Planner Editor',
        },
      })
    ).id;
    otherUserId = (
      await prisma.user.create({
        data: {
          auth0Sub: 'auth0|planner-update-other',
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
          images: {
            create: [
              {
                id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
                s3Key: 'recipes/planner-update-second.webp',
              },
              {
                id: '00000000-0000-4000-8000-000000000001',
                s3Key: imageKey,
              },
            ],
          },
        },
      })
    ).id;
    entryId = (
      await prisma.plannerEntry.create({
        data: {
          userId,
          recipeId,
          date: new Date('2026-11-03T00:00:00.000Z'),
          quantity: 2,
        },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it.each([1, 3, 100])(
    'sets quantity to %i, returns the complete contract and preserves all other data',
    async (quantity) => {
      const original = await readEntry();
      const otherEntry = await prisma.plannerEntry.create({
        data: { ...original, id: undefined, userId: otherUserId },
      });
      const nextDay = await prisma.plannerEntry.create({
        data: { ...original, id: undefined, date: new Date('2026-11-04') },
      });
      const recipeBefore = await prisma.recipe.findUniqueOrThrow({
        where: { id: recipeId },
      });

      const response = await patch({ quantity }).expect(200);

      expect(response.body).toEqual({
        id: entryId,
        date: '2026-11-03',
        quantity,
        recipeId,
        title: 'Lemon chicken',
        imageUrl: `https://signed.test/${imageKey}`,
        time: 20,
        timeUnit: RecipeTimeUnit.MINUTOS,
      });
      expect(await readEntry()).toEqual({ ...original, quantity });
      expect(await prisma.plannerEntry.count()).toBe(3);
      expect(
        await prisma.plannerEntry.findUnique({ where: { id: otherEntry.id } }),
      ).toEqual(otherEntry);
      expect(
        await prisma.plannerEntry.findUnique({ where: { id: nextDay.id } }),
      ).toEqual(nextDay);
      expect(
        await prisma.recipe.findUnique({ where: { id: recipeId } }),
      ).toEqual(recipeBefore);
      expect(getSignedReadUrl).toHaveBeenCalledTimes(1);
      expect(getSignedReadUrl).toHaveBeenCalledWith(imageKey);
    },
  );

  it('returns null without images and preserves the recipe time unit', async () => {
    await prisma.recipeImage.deleteMany({ where: { recipeId } });
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { time: 2, timeUnit: RecipeTimeUnit.HORAS },
    });
    const response = await patch({ quantity: 4 }).expect(200);
    expect(response.body).toEqual({
      id: entryId,
      date: '2026-11-03',
      quantity: 4,
      recipeId,
      title: 'Lemon chicken',
      imageUrl: null,
      time: 2,
      timeUnit: RecipeTimeUnit.HORAS,
    });
    expect(getSignedReadUrl).not.toHaveBeenCalled();
  });

  it('sets an absolute quantity instead of accumulating it on repeated requests', async () => {
    await patch({ quantity: 3 }).expect(200);
    await patch({ quantity: 3 }).expect(200);
    expect((await readEntry()).quantity).toBe(3);
  });

  it.each<[string, Record<string, unknown>]>([
    ['missing quantity', {}],
    ['zero', { quantity: 0 }],
    ['negative', { quantity: -1 }],
    ['above the maximum', { quantity: 101 }],
    ['fractional', { quantity: 1.5 }],
    ['numeric string', { quantity: '3' }],
    ['text', { quantity: 'three' }],
    ['null', { quantity: null }],
    ['boolean', { quantity: true }],
    ['array', { quantity: [3] }],
    ['object', { quantity: { value: 3 } }],
    ['unexpected userId', { quantity: 3, userId: 'another-user' }],
    ['unexpected recipeId', { quantity: 3, recipeId: 'another-recipe' }],
    ['unexpected date', { quantity: 3, date: '2026-11-04' }],
  ])(
    'rejects %s with 400 and leaves the entry unchanged',
    async (_name, body) => {
      const original = await readEntry();
      const response = await patch(body).expect(400);
      expect((response.body as { message: string[] }).message).toEqual(
        expect.arrayContaining([expect.any(String)]),
      );
      expect(await readEntry()).toEqual(original);
      expect(getSignedReadUrl).not.toHaveBeenCalled();
    },
  );

  it('returns 403 for another user’s entry and leaves it unchanged', async () => {
    await prisma.plannerEntry.update({
      where: { id: entryId },
      data: { userId: otherUserId },
    });
    const original = await readEntry();
    await patch({ quantity: 3 }).expect(403);
    expect(await readEntry()).toEqual(original);
    expect(getSignedReadUrl).not.toHaveBeenCalled();
  });

  it('returns 404 for a nonexistent entry', async () => {
    const original = await readEntry();
    await patch({ quantity: 3 }, '11111111-1111-4111-8111-111111111111').expect(
      404,
    );
    expect(await readEntry()).toEqual(original);
    expect(getSignedReadUrl).not.toHaveBeenCalled();
  });

  it('returns 404 if the entry is deleted after the ownership check', async () => {
    getSignedReadUrl.mockImplementationOnce(async (key: string) => {
      await prisma.plannerEntry.delete({ where: { id: entryId } });
      return `https://signed.test/${key}`;
    });
    await patch({ quantity: 3 }).expect(404);
    expect(await prisma.plannerEntry.count()).toBe(0);
    expect(await prisma.recipe.count({ where: { id: recipeId } })).toBe(1);
  });

  it('returns 400 for an invalid UUID', async () => {
    const original = await readEntry();
    await patch({ quantity: 3 }, 'not-a-uuid').expect(400);
    expect(await readEntry()).toEqual(original);
    expect(getSignedReadUrl).not.toHaveBeenCalled();
  });

  it('returns 401 for a token without a synchronized local user', async () => {
    await prisma.plannerEntry.delete({ where: { id: entryId } });
    await prisma.user.delete({ where: { id: userId } });
    await patch({ quantity: 3 }).expect(401);
    expect(getSignedReadUrl).not.toHaveBeenCalled();
  });

  it('returns 401 without a token or with an invalid token through the real global guard', async () => {
    const original = await readEntry();
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue({ getSignedReadUrl })
      .compile();
    const protectedApp = moduleFixture.createNestApplication();
    configureApp(protectedApp);
    await protectedApp.init();
    try {
      const server = protectedApp.getHttpServer() as Server;
      await request(server)
        .patch(`/planner/${entryId}`)
        .send({ quantity: 3 })
        .expect(401);
      await request(server)
        .patch(`/planner/${entryId}`)
        .set('Authorization', 'Bearer invalid-token')
        .send({ quantity: 3 })
        .expect(401);
      expect(await readEntry()).toEqual(original);
      expect(getSignedReadUrl).not.toHaveBeenCalled();
    } finally {
      await protectedApp.close();
    }
  });
});
