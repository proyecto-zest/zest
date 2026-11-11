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

describeWithDatabase('GET /planner (e2e)', () => {
  const prisma = new PrismaClient();
  const range = { from: '2026-11-03', to: '2026-11-09' };
  const imageKey = 'recipes/planner-list-first.webp';
  const signedUrl = (key: string) => `https://signed.test/${key}`;
  const getSignedReadUrl = jest.fn((key: string) =>
    Promise.resolve(signedUrl(key)),
  );
  let app: INestApplication;
  let userId: string;
  let otherUserId: string;
  let recipeId: string;

  const get = (query: Record<string, unknown> = range) =>
    request(app.getHttpServer() as Server)
      .get('/planner')
      .query(query);

  const createRecipe = (title = 'Lemon chicken') =>
    prisma.recipe.create({
      data: {
        authorId: otherUserId,
        title,
        description: 'Chicken with lemon and olive oil.',
        category: RecipeCategory.ALMUERZO,
        difficulty: RecipeDifficulty.FACIL,
        time: 20,
        timeUnit: RecipeTimeUnit.MINUTOS,
        servings: 2,
      },
    });

  const createEntry = (
    date: string,
    ownerId = userId,
    selectedRecipeId = recipeId,
  ) =>
    prisma.plannerEntry.create({
      data: {
        userId: ownerId,
        recipeId: selectedRecipeId,
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
    const user = await prisma.user.create({
      data: {
        auth0Sub: DEFAULT_TEST_AUTHENTICATED_USER.sub,
        email: 'planner-reader@zest.test',
        name: 'Planner Reader',
      },
    });
    userId = user.id;
    const other = await prisma.user.create({
      data: {
        auth0Sub: 'auth0|planner-list-other-user',
        email: 'planner-other@zest.test',
        name: 'Other Cook',
      },
    });
    otherUserId = other.id;
    recipeId = (await createRecipe()).id;
    // Insert the larger ID first: selection must follow the shared image order.
    await prisma.recipeImage.createMany({
      data: [
        {
          id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
          recipeId,
          s3Key: 'recipes/planner-list-second.webp',
        },
        {
          id: '00000000-0000-4000-8000-000000000001',
          recipeId,
          s3Key: imageKey,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('returns only the authenticated user’s entries in the inclusive range, ordered by date', async () => {
    const end = await createEntry('2026-11-09');
    const start = await createEntry('2026-11-03');
    const middle = await createEntry('2026-11-06');
    await createEntry('2026-11-02');
    await createEntry('2026-11-10');
    await createEntry('2026-11-06', otherUserId);

    const response = await get().expect(200);
    const expected = [start, middle, end].map((entry) => ({
      id: entry.id,
      date: entry.date.toISOString().slice(0, 10),
      quantity: 2,
      recipeId,
      title: 'Lemon chicken',
      imageUrl: signedUrl(imageKey),
      time: 20,
      timeUnit: RecipeTimeUnit.MINUTOS,
    }));
    expect(response.body as PlannerEntryResponseDto[]).toEqual(expected);
    expect(getSignedReadUrl).toHaveBeenCalledTimes(1);
    expect(getSignedReadUrl).toHaveBeenCalledWith(imageKey);
    expect(await prisma.plannerEntry.count()).toBe(6);
  });

  it('signs each distinct image once even when recipes are planned on several days', async () => {
    const second = await createRecipe('Tomato soup');
    const secondKey = 'recipes/planner-list-tomato.webp';
    await prisma.recipeImage.create({
      data: { recipeId: second.id, s3Key: secondKey },
    });
    await createEntry('2026-11-03');
    await createEntry('2026-11-04');
    await createEntry('2026-11-05', userId, second.id);
    await createEntry('2026-11-06', userId, second.id);

    const response = await get().expect(200);
    expect(
      (response.body as PlannerEntryResponseDto[]).map(
        ({ imageUrl }) => imageUrl,
      ),
    ).toEqual([
      signedUrl(imageKey),
      signedUrl(imageKey),
      signedUrl(secondKey),
      signedUrl(secondKey),
    ]);
    expect(getSignedReadUrl).toHaveBeenCalledTimes(2);
    expect(getSignedReadUrl).toHaveBeenCalledWith(imageKey);
    expect(getSignedReadUrl).toHaveBeenCalledWith(secondKey);
  });

  it('deduplicates by image key even when different recipes share the same object', async () => {
    const second = await createRecipe('Roasted chicken');
    await prisma.recipeImage.create({
      data: { recipeId: second.id, s3Key: imageKey },
    });
    await createEntry('2026-11-03');
    await createEntry('2026-11-04', userId, second.id);

    const response = await get().expect(200);
    expect(
      (response.body as PlannerEntryResponseDto[]).map(
        ({ imageUrl }) => imageUrl,
      ),
    ).toEqual([signedUrl(imageKey), signedUrl(imageKey)]);
    expect(getSignedReadUrl).toHaveBeenCalledTimes(1);
  });

  it('signs again for each request rather than caching expiring URLs across requests', async () => {
    await createEntry('2026-11-03');
    getSignedReadUrl.mockResolvedValueOnce('https://signed.test/first-request');
    getSignedReadUrl.mockResolvedValueOnce(
      'https://signed.test/second-request',
    );

    const first = await get().expect(200);
    const second = await get().expect(200);
    expect((first.body as PlannerEntryResponseDto[])[0].imageUrl).toBe(
      'https://signed.test/first-request',
    );
    expect((second.body as PlannerEntryResponseDto[])[0].imageUrl).toBe(
      'https://signed.test/second-request',
    );
    expect(getSignedReadUrl).toHaveBeenCalledTimes(2);
  });

  it('returns an empty array for a user without entries, even when another user has some', async () => {
    await createEntry('2026-11-03', otherUserId);
    const response = await get().expect(200);
    expect(response.body).toEqual([]);
    expect(getSignedReadUrl).not.toHaveBeenCalled();
  });

  it('returns an empty array when all entries are outside the requested range', async () => {
    await createEntry('2026-11-10');
    expect((await get().expect(200)).body).toEqual([]);
  });

  it('supports a single-day range and returns null for a missing image', async () => {
    const recipe = await createRecipe('Slow soup');
    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { time: 2, timeUnit: RecipeTimeUnit.HORAS },
    });
    const entry = await createEntry('2026-11-03', userId, recipe.id);
    await createEntry('2026-11-04');
    const response = await get({ from: '2026-11-03', to: '2026-11-03' }).expect(
      200,
    );
    expect(response.body as PlannerEntryResponseDto[]).toEqual([
      {
        id: entry.id,
        date: '2026-11-03',
        quantity: 2,
        recipeId: recipe.id,
        title: 'Slow soup',
        imageUrl: null,
        time: 2,
        timeUnit: RecipeTimeUnit.HORAS,
      },
    ]);
    expect(getSignedReadUrl).not.toHaveBeenCalled();
  });

  it('breaks same-day ties by entry ID', async () => {
    const secondRecipe = await createRecipe('Tomato soup');
    const firstId = '11111111-1111-4111-8111-111111111111';
    const secondId = '99999999-9999-4999-8999-999999999999';
    await prisma.plannerEntry.createMany({
      data: [
        {
          id: secondId,
          userId,
          recipeId,
          date: new Date('2026-11-03T00:00:00.000Z'),
        },
        {
          id: firstId,
          userId,
          recipeId: secondRecipe.id,
          date: new Date('2026-11-03T00:00:00.000Z'),
        },
      ],
    });
    const response = await get().expect(200);
    expect(
      (response.body as PlannerEntryResponseDto[]).map((entry) => entry.id),
    ).toEqual([firstId, secondId]);
  });

  it.each([
    { from: '2028-02-28', to: '2028-03-01', date: '2028-02-29' },
    { from: '2026-10-21', to: '2026-11-20', date: '2026-11-03' },
    { from: '2028-02-01', to: '2028-03-02', date: '2028-02-29' },
    { from: '2026-12-15', to: '2027-01-14', date: '2027-01-01' },
    { from: '0001-01-01', to: '0001-01-31', date: '0001-01-31' },
    { from: '9999-12-01', to: '9999-12-31', date: '9999-12-31' },
  ])(
    'accepts valid calendar ranges including $date',
    async ({ from, to, date }) => {
      const entry = await createEntry(date);
      const response = await get({ from, to }).expect(200);
      expect(
        (response.body as PlannerEntryResponseDto[]).map((entry) => entry.id),
      ).toEqual([entry.id]);
    },
  );

  it.each([
    { from: '2026-10-20', to: '2026-11-20' },
    { from: '2028-02-01', to: '2028-03-03' },
    { from: '2026-12-15', to: '2027-01-15' },
    { from: '0001-01-01', to: '9999-12-31' },
  ])(
    'rejects a range longer than 31 inclusive days: $from to $to',
    async (query) => {
      const response = await get(query).expect(400);
      expect((response.body as { message: string[] }).message).toContain(
        'planner range must not exceed 31 days, including from and to',
      );
      expect(getSignedReadUrl).not.toHaveBeenCalled();
    },
  );

  it.each<[string, Record<string, unknown>]>([
    ['missing both dates', {}],
    ['missing from', { to: range.to }],
    ['missing to', { from: range.from }],
    ['empty from', { ...range, from: '' }],
    ['empty to', { ...range, to: '' }],
    ['non-date text', { ...range, from: 'yesterday' }],
    ['impossible from date', { ...range, from: '2026-02-30' }],
    ['impossible to date', { ...range, to: '2026-11-31' }],
    ['invalid month', { ...range, to: '2026-13-01' }],
    ['non-leap February 29', { ...range, from: '2026-02-29' }],
    ['missing zero padding', { ...range, from: '2026-1-3' }],
    ['year zero', { ...range, from: '0000-01-01' }],
    ['from with time and zone', { ...range, from: '2026-11-03T23:00:00Z' }],
    ['to with timezone offset', { ...range, to: '2026-11-09T23:00:00-03:00' }],
    ['repeated from', { ...range, from: [range.from, range.to] }],
    ['repeated to', { ...range, to: [range.from, range.to] }],
    ['inverted range', { from: range.to, to: range.from }],
    [
      'unexpected userId',
      { ...range, userId: '11111111-1111-4111-8111-111111111111' },
    ],
  ])('returns 400 with a clear message for %s', async (_name, query) => {
    const response = await get(query).expect(400);
    expect((response.body as { message: string[] }).message).toEqual(
      expect.arrayContaining([expect.any(String)]),
    );
    expect(getSignedReadUrl).not.toHaveBeenCalled();
  });

  it('returns 401 when the token has no synchronized local user', async () => {
    await prisma.user.delete({ where: { id: userId } });
    await get().expect(401);
  });

  it('is protected by the real global guard and returns 401 without a token', async () => {
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
      await request(protectedApp.getHttpServer() as Server)
        .get('/planner')
        .query(range)
        .expect(401);
      expect(getSignedReadUrl).not.toHaveBeenCalled();
    } finally {
      await protectedApp.close();
    }
  });
});
