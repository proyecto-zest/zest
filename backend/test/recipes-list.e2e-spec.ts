import { INestApplication } from '@nestjs/common';
import {
  PrismaClient,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import {
  DEFAULT_RECIPES_LIMIT,
  DEFAULT_RECIPES_PAGE,
  MAX_RECIPES_LIMIT,
} from '../src/recipes/recipes.constants';
import { PaginatedRecipesResponseDto } from '../src/recipes/dto/recipe-response.dto';
import { StorageService } from '../src/storage/storage.service';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('GET /recipes (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication;
  const getSignedReadUrl = jest.fn((key: string) =>
    Promise.resolve(`https://signed.test/${key}`),
  );

  const createRecipes = async (count: number): Promise<string[]> => {
    const ids = Array.from({ length: count }, () => randomUUID());

    await prisma.recipe.createMany({
      data: ids.map((id, index) => ({
        id,
        title: `Receta ${index + 1}`,
        description: `Descripción ${index + 1}`,
        category: RecipeCategory.ALMUERZO,
        time: 30,
        timeUnit: RecipeTimeUnit.MINUTOS,
        difficulty: RecipeDifficulty.FACIL,
        servings: 2,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)),
      })),
    });
    await prisma.recipeImage.createMany({
      data: ids.map((recipeIdValue, index) => ({
        recipeId: recipeIdValue,
        s3Key: `recipes/${index + 1}.webp`,
      })),
    });

    return ids;
  };

  beforeAll(async () => {
    await prisma.$connect();
    await resetTestDatabase(prisma);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue({ getSignedReadUrl })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(() => resetTestDatabase(prisma));

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('returns the first page with defaults and correct metadata', async () => {
    await createRecipes(25);

    const response = await request(app.getHttpServer() as Server)
      .get('/recipes')
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(body.recipes).toHaveLength(DEFAULT_RECIPES_LIMIT);
    expect(body.pagination).toEqual({
      total: 25,
      page: DEFAULT_RECIPES_PAGE,
      limit: DEFAULT_RECIPES_LIMIT,
      totalPages: 2,
    });
  });

  it('returns only the expected recipe card fields', async () => {
    const [recipeId] = await createRecipes(1);
    await prisma.recipeImage.create({
      data: {
        recipeId,
        s3Key: 'recipes/secondary.webp',
      },
    });

    const response = await request(app.getHttpServer() as Server)
      .get('/recipes')
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(Object.keys(body.recipes[0]).sort()).toEqual(
      [
        'id',
        'title',
        'imageUrls',
        'category',
        'difficulty',
        'time',
        'servings',
      ].sort(),
    );
    expect([...body.recipes[0].imageUrls].sort()).toEqual(
      [
        'https://signed.test/recipes/1.webp',
        'https://signed.test/recipes/secondary.webp',
      ].sort(),
    );
  });

  it('returns distinct consecutive pages without gaps', async () => {
    const ids = await createRecipes(25);
    const expectedOrder = ids.reverse();

    const firstResponse = await request(app.getHttpServer() as Server)
      .get('/recipes?page=1&limit=10')
      .expect(200);
    const secondResponse = await request(app.getHttpServer() as Server)
      .get('/recipes?page=2&limit=10')
      .expect(200);
    const firstPage = firstResponse.body as PaginatedRecipesResponseDto;
    const secondPage = secondResponse.body as PaginatedRecipesResponseDto;
    const receivedIds = [...firstPage.recipes, ...secondPage.recipes].map(
      ({ id }) => id,
    );

    expect(receivedIds).toEqual(expectedOrder.slice(0, 20));
    expect(new Set(receivedIds).size).toBe(20);
  });

  it('returns an empty list with zero metadata when there are no recipes', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/recipes')
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(body).toEqual({
      recipes: [],
      pagination: {
        total: 0,
        page: DEFAULT_RECIPES_PAGE,
        limit: DEFAULT_RECIPES_LIMIT,
        totalPages: 0,
      },
    });
  });

  it('caps a requested limit above the maximum', async () => {
    await createRecipes(MAX_RECIPES_LIMIT + 5);

    const response = await request(app.getHttpServer() as Server)
      .get(`/recipes?limit=${MAX_RECIPES_LIMIT + 50}`)
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(body.recipes).toHaveLength(MAX_RECIPES_LIMIT);
    expect(body.pagination).toMatchObject({
      total: MAX_RECIPES_LIMIT + 5,
      limit: MAX_RECIPES_LIMIT,
      totalPages: 2,
    });
  });

  it.each([
    '?page=0',
    '?page=-1',
    '?page=1.5',
    '?page=invalid',
    '?limit=0',
    '?limit=-1',
    '?limit=1.5',
    '?limit=invalid',
  ])('returns 400 for invalid params: %s', async (query) => {
    await request(app.getHttpServer() as Server)
      .get(`/recipes${query}`)
      .expect(400);
  });

  it('orders recipes by creation date descending', async () => {
    const ids = await createRecipes(3);
    await prisma.recipe.update({
      where: { id: ids[0] },
      data: { createdAt: new Date(Date.UTC(2026, 0, 2)) },
    });

    const response = await request(app.getHttpServer() as Server)
      .get('/recipes?limit=3')
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(body.recipes.map(({ id }) => id)).toEqual([ids[0], ids[2], ids[1]]);
  });
});
