import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  PrismaClient,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PlannerEntryResponseDto } from '../src/planner-entries/dto/planner-entry-response.dto';
import { MAX_PLANNER_QUANTITY } from '../src/planner-entries/planner-entries.constants';
import { PlannerEntriesModule } from '../src/planner-entries/planner-entries.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RecipesService } from '../src/recipes/recipes.service';
import { StorageService } from '../src/storage/storage.service';
import { authTestConfigModuleOptions } from './auth-test-helper';
import {
  DEFAULT_TEST_AUTHENTICATED_USER,
  withAuthenticatedUser,
} from './protected-route-test-helper';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('POST /planner (e2e)', () => {
  const prisma = new PrismaClient();
  const date = '2026-11-03';
  const imageKey = 'recipes/planner-tomato-soup.webp';
  const getSignedReadUrl = jest.fn((key: string) =>
    Promise.resolve(`https://signed.test/${key}`),
  );
  let app: INestApplication;
  let currentUserId: string;
  let recipeId: string;

  async function buildApp(realGlobalGuard = false): Promise<INestApplication> {
    const imports = realGlobalGuard
      ? [AppModule]
      : [
          ConfigModule.forRoot(authTestConfigModuleOptions()),
          PrismaModule,
          PlannerEntriesModule,
        ];
    const moduleFixture = await Test.createTestingModule({ imports })
      .overrideProvider(StorageService)
      .useValue({ getSignedReadUrl })
      .compile();
    const app = moduleFixture.createNestApplication();
    configureApp(app);
    return app;
  }

  const post = (body: Record<string, unknown>) =>
    request(app.getHttpServer() as Server)
      .post('/planner')
      .send(body);

  const payload = (overrides: Record<string, unknown> = {}) => ({
    recipeId,
    date,
    quantity: 2,
    ...overrides,
  });

  beforeAll(async () => {
    await prisma.$connect();
    app = await buildApp();
    withAuthenticatedUser(app);
    await app.init();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await resetTestDatabase(prisma);
    const user = await prisma.user.create({
      data: {
        auth0Sub: DEFAULT_TEST_AUTHENTICATED_USER.sub,
        email: 'planner-cook@zest.test',
        name: 'Planner Cook',
      },
    });
    currentUserId = user.id;
    const author = await prisma.user.create({
      data: {
        auth0Sub: 'auth0|planner-recipe-author',
        email: 'planner-author@zest.test',
        name: 'Recipe Author',
      },
    });
    const recipe = await prisma.recipe.create({
      data: {
        authorId: author.id,
        title: 'Roasted tomato soup',
        description: 'Roasted tomatoes blended into a warm soup.',
        category: RecipeCategory.CENA,
        difficulty: RecipeDifficulty.FACIL,
        time: 40,
        timeUnit: RecipeTimeUnit.MINUTOS,
        servings: 2,
        images: { create: { s3Key: imageKey } },
      },
    });
    recipeId = recipe.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('creates an entry for the authenticated user with another author’s recipe and card data', async () => {
    const response = await post(payload()).expect(201);
    const body = response.body as PlannerEntryResponseDto;

    expect(body).toEqual({
      id: expect.any(String) as string,
      recipeId,
      date,
      quantity: 2,
      title: 'Roasted tomato soup',
      imageUrl: `https://signed.test/${imageKey}`,
      time: 40,
      timeUnit: RecipeTimeUnit.MINUTOS,
    });
    const stored = await prisma.plannerEntry.findUniqueOrThrow({
      where: { id: body.id },
    });
    expect(stored).toMatchObject({
      userId: currentUserId,
      recipeId,
      quantity: 2,
    });
    expect(stored.date.toISOString()).toBe(`${date}T00:00:00.000Z`);
    expect(getSignedReadUrl).toHaveBeenCalledWith(imageKey);
  });

  it('returns null for a recipe without images and preserves its time unit', async () => {
    await prisma.recipeImage.deleteMany({ where: { recipeId } });
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { time: 2, timeUnit: RecipeTimeUnit.HORAS },
    });

    const response = await post(payload()).expect(201);
    expect(response.body as PlannerEntryResponseDto).toMatchObject({
      imageUrl: null,
      time: 2,
      timeUnit: RecipeTimeUnit.HORAS,
    });
    expect(getSignedReadUrl).not.toHaveBeenCalled();
  });

  it('selects the same stable first image as the recipe feed', async () => {
    await prisma.recipeImage.deleteMany({ where: { recipeId } });
    await prisma.recipeImage.createMany({
      data: [
        {
          id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
          recipeId,
          s3Key: 'recipes/second.webp',
        },
        {
          id: '00000000-0000-4000-8000-000000000001',
          recipeId,
          s3Key: imageKey,
        },
      ],
    });
    const feedService = new RecipesService(
      app.get(PrismaService),
      app.get(StorageService),
    );
    const feed = await feedService.findAll({ page: 1, limit: 20 });
    const first = await post(payload()).expect(201);
    const second = await post(payload()).expect(201);
    expect((first.body as PlannerEntryResponseDto).imageUrl).toBe(
      feed.recipes[0].imageUrls[0],
    );
    expect((second.body as PlannerEntryResponseDto).imageUrl).toBe(
      `https://signed.test/${imageKey}`,
    );
  });

  it('increments the same entry on repeated assignment', async () => {
    const first = await post(payload()).expect(201);
    const second = await post(payload({ quantity: 3 })).expect(201);
    expect(second.body as PlannerEntryResponseDto).toMatchObject({
      id: (first.body as PlannerEntryResponseDto).id,
      quantity: 5,
    });
    expect(await prisma.plannerEntry.count()).toBe(1);
    expect((await prisma.plannerEntry.findFirstOrThrow()).quantity).toBe(5);
  });

  it('keeps separate entries for different dates and users', async () => {
    await post(payload()).expect(201);
    await post(payload({ date: '2026-11-04' })).expect(201);
    const otherApp = await buildApp();
    withAuthenticatedUser(otherApp, {
      ...DEFAULT_TEST_AUTHENTICATED_USER,
      sub: 'auth0|planner-recipe-author',
    });
    await otherApp.init();
    try {
      await request(otherApp.getHttpServer() as Server)
        .post('/planner')
        .send(payload())
        .expect(201);
      expect(await prisma.plannerEntry.count()).toBe(3);
      expect(
        await prisma.plannerEntry.count({ where: { userId: currentUserId } }),
      ).toBe(2);
    } finally {
      await otherApp.close();
    }
  });

  it.each([1, MAX_PLANNER_QUANTITY])(
    'accepts quantity at the boundary %s',
    async (quantity) => {
      const response = await post(payload({ quantity })).expect(201);
      expect((response.body as PlannerEntryResponseDto).quantity).toBe(
        quantity,
      );
    },
  );

  it('returns 400 and rolls back when the accumulated quantity exceeds the maximum', async () => {
    await post(payload({ quantity: MAX_PLANNER_QUANTITY - 1 })).expect(201);
    const response = await post(payload()).expect(400);
    expect((response.body as { message: string }).message).toContain('100');
    const entries = await prisma.plannerEntry.findMany();
    expect(entries).toHaveLength(1);
    expect(entries[0].quantity).toBe(MAX_PLANNER_QUANTITY - 1);
  });

  it('does not lose increments when the first assignments arrive concurrently', async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => post(payload())),
    );
    expect(responses.map(({ status }) => status)).toEqual([
      201, 201, 201, 201, 201,
    ]);
    const entries = await prisma.plannerEntry.findMany();
    expect(entries).toHaveLength(1);
    expect(entries[0].quantity).toBe(10);
  });

  it('does not exceed the accumulated maximum under concurrent requests', async () => {
    await post(payload({ quantity: MAX_PLANNER_QUANTITY - 20 })).expect(201);
    const responses = await Promise.all(
      Array.from({ length: 4 }, () => post(payload({ quantity: 10 }))),
    );
    expect(responses.map(({ status }) => status).sort()).toEqual([
      201, 201, 400, 400,
    ]);
    const entries = await prisma.plannerEntry.findMany();
    expect(entries).toHaveLength(1);
    expect(entries[0].quantity).toBe(MAX_PLANNER_QUANTITY);
  });

  it.each(['2028-02-29', '2024-01-01'])(
    'accepts a real calendar date, including a leap day or a past date: %s',
    async (date) => {
      const response = await post(payload({ date })).expect(201);
      expect((response.body as PlannerEntryResponseDto).date).toBe(date);
    },
  );

  it.each<[string, Record<string, unknown>]>([
    ['missing recipeId', { recipeId: undefined }],
    ['invalid recipeId', { recipeId: 'not-a-uuid' }],
    ['missing date', { date: undefined }],
    ['null date', { date: null }],
    ['non-string date', { date: 20261103 }],
    ['date with a time and UTC zone', { date: '2026-11-03T23:00:00Z' }],
    ['date with a timezone offset', { date: '2026-11-03T23:00:00-03:00' }],
    ['date with a time', { date: '2026-11-03T00:00:00' }],
    ['date with a trailing zone', { date: '2026-11-03Z' }],
    ['date without zero padding', { date: '2026-1-3' }],
    ['date with an invalid month', { date: '2026-13-03' }],
    ['date with an invalid day', { date: '2026-02-30' }],
    ['non-leap-year February 29', { date: '2026-02-29' }],
    ['year zero', { date: '0000-01-01' }],
    ['missing quantity', { quantity: undefined }],
    ['quantity zero', { quantity: 0 }],
    ['negative quantity', { quantity: -1 }],
    ['fractional quantity', { quantity: 1.5 }],
    ['string quantity', { quantity: '2' }],
    ['quantity above maximum', { quantity: MAX_PLANNER_QUANTITY + 1 }],
    ['unexpected userId', { userId: '11111111-1111-4111-8111-111111111111' }],
  ])(
    'returns 400 with a clear message and no entry for %s',
    async (_label, overrides) => {
      const response = await post(payload(overrides)).expect(400);
      const body = response.body as { message: string[] };
      expect(body.message).toEqual(
        expect.arrayContaining([expect.any(String)]),
      );
      expect(await prisma.plannerEntry.count()).toBe(0);
    },
  );

  it('returns 404 without creating an entry for a missing recipe', async () => {
    const response = await post(
      payload({ recipeId: '11111111-1111-4111-8111-111111111111' }),
    ).expect(404);
    expect((response.body as { message: string }).message).toBe(
      'Recipe not found',
    );
    expect(await prisma.plannerEntry.count()).toBe(0);
  });

  it('returns 404 if the recipe is deleted after lookup but before writing', async () => {
    getSignedReadUrl.mockImplementationOnce(async () => {
      await prisma.recipeImage.deleteMany({ where: { recipeId } });
      await prisma.recipe.delete({ where: { id: recipeId } });
      return 'https://signed.test/deleted.webp';
    });
    await post(payload()).expect(404);
    expect(await prisma.plannerEntry.count()).toBe(0);
  });

  it('returns 401 when a valid token has no synchronized local user', async () => {
    await prisma.user.delete({ where: { id: currentUserId } });
    await post(payload()).expect(401);
    expect(await prisma.plannerEntry.count()).toBe(0);
  });

  it('registers POST /planner under the real global guard and rejects a missing token', async () => {
    const protectedApp = await buildApp(true);
    await protectedApp.init();
    try {
      const response = await request(protectedApp.getHttpServer() as Server)
        .post('/planner')
        .send(payload())
        .expect(401);
      expect((response.body as { message: string }).message).toBe(
        'Authentication token is required',
      );
      expect(await prisma.plannerEntry.count()).toBe(0);
    } finally {
      await protectedApp.close();
    }
  });
});
