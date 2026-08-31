import { INestApplication, ValidationPipe } from '@nestjs/common';
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
import {
  DEFAULT_RECIPES_LIMIT,
  DEFAULT_RECIPES_PAGE,
  MAX_RECIPES_LIMIT,
} from '../src/recipes/recipes.constants';
import { PaginatedRecipes } from '../src/recipes/recipes.service';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('GET /recipes (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication;

  const recipeId = (position: number): string =>
    `00000000-0000-4000-8000-${position.toString().padStart(12, '0')}`;

  const cleanRecipes = async (): Promise<void> => {
    await prisma.recipeImage.deleteMany();
    await prisma.recipeStep.deleteMany();
    await prisma.recipeIngredient.deleteMany();
    await prisma.recipe.deleteMany();
  };

  const createRecipes = async (count: number): Promise<string[]> => {
    const ids = Array.from({ length: count }, (_, index) =>
      recipeId(index + 1),
    );

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

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(cleanRecipes);

  afterAll(async () => {
    await cleanRecipes();
    await app.close();
    await prisma.$disconnect();
  });

  it('returns the first page with defaults and correct metadata', async () => {
    await createRecipes(25);

    const response = await request(app.getHttpServer() as Server)
      .get('/recipes')
      .expect(200);
    const body = response.body as PaginatedRecipes;

    expect(body.recipes).toHaveLength(DEFAULT_RECIPES_LIMIT);
    expect(body.pagination).toEqual({
      total: 25,
      page: DEFAULT_RECIPES_PAGE,
      limit: DEFAULT_RECIPES_LIMIT,
      totalPages: 2,
    });
  });

  it('returns only the expected recipe card fields', async () => {
    await createRecipes(1);

    const response = await request(app.getHttpServer() as Server)
      .get('/recipes')
      .expect(200);
    const body = response.body as PaginatedRecipes;

    expect(Object.keys(body.recipes[0]).sort()).toEqual(
      [
        'id',
        'title',
        'imageUrl',
        'category',
        'difficulty',
        'time',
        'servings',
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
    const firstPage = firstResponse.body as PaginatedRecipes;
    const secondPage = secondResponse.body as PaginatedRecipes;
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
    const body = response.body as PaginatedRecipes;

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
    const body = response.body as PaginatedRecipes;

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

  it('orders recipes by id descending', async () => {
    const ids = await createRecipes(3);

    const response = await request(app.getHttpServer() as Server)
      .get('/recipes?limit=3')
      .expect(200);
    const body = response.body as PaginatedRecipes;

    expect(body.recipes.map(({ id }) => id)).toEqual(ids.reverse());
  });
});
