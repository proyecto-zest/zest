import { INestApplication } from '@nestjs/common';
import {
  IngredientUnit,
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
import { RecipeDetailResponseDto } from '../src/recipes/dto/recipe-response.dto';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('GET /recipes/:id (e2e)', () => {
  const prisma = new PrismaClient();
  const ingredientName = 'Ingrediente detalle ZEST-15';
  let app: INestApplication;

  beforeAll(async () => {
    await prisma.$connect();
    await resetTestDatabase(prisma);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(() => resetTestDatabase(prisma));

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('returns the complete data for an existing recipe', async () => {
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Receta de detalle',
        description: 'Descripción completa.',
        category: RecipeCategory.ALMUERZO,
        time: 30,
        timeUnit: RecipeTimeUnit.MINUTOS,
        difficulty: RecipeDifficulty.FACIL,
        servings: 2,
        ingredients: {
          create: {
            amount: '2',
            unit: IngredientUnit.UNIDAD,
            ingredient: { create: { name: ingredientName } },
          },
        },
        steps: {
          create: [
            { stepNumber: 2, text: 'Cocinar la receta.' },
            { stepNumber: 1, text: 'Preparar los ingredientes.' },
          ],
        },
        images: {
          create: [
            { s3Key: 'recipes/detail.webp' },
            { s3Key: 'recipes/detail-secondary.webp' },
          ],
        },
      },
    });

    const response = await request(app.getHttpServer() as Server)
      .get(`/recipes/${recipe.id}`)
      .expect(200);
    const body = response.body as RecipeDetailResponseDto;

    expect(body).toMatchObject({
      id: recipe.id,
      authorId: null,
      title: 'Receta de detalle',
      description: 'Descripción completa.',
      category: RecipeCategory.ALMUERZO,
      time: 30,
      timeUnit: RecipeTimeUnit.MINUTOS,
      difficulty: RecipeDifficulty.FACIL,
      servings: 2,
      ingredients: [
        {
          amount: '2',
          unit: IngredientUnit.UNIDAD,
          ingredient: { name: ingredientName },
        },
      ],
      steps: [
        { stepNumber: 1, text: 'Preparar los ingredientes.' },
        { stepNumber: 2, text: 'Cocinar la receta.' },
      ],
    });
    expect([...body.imageUrls].sort()).toEqual(
      [
        'https://zest-images-test.s3.us-east-1.amazonaws.com/recipes/detail.webp',
        'https://zest-images-test.s3.us-east-1.amazonaws.com/recipes/detail-secondary.webp',
      ].sort(),
    );
    expect(body).not.toHaveProperty('images');
  });

  it('returns 404 when the recipe does not exist', async () => {
    await request(app.getHttpServer() as Server)
      .get(`/recipes/${randomUUID()}`)
      .expect(404);
  });

  it('returns 400 when the recipe id is not a UUID', async () => {
    await request(app.getHttpServer() as Server)
      .get('/recipes/not-a-uuid')
      .expect(400);
  });

  it('uses the default image when the recipe has no images', async () => {
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Receta sin imagen',
        description: 'Descripción completa.',
        category: RecipeCategory.ALMUERZO,
        time: 30,
        timeUnit: RecipeTimeUnit.MINUTOS,
        difficulty: RecipeDifficulty.FACIL,
        servings: 2,
      },
    });

    const response = await request(app.getHttpServer() as Server)
      .get(`/recipes/${recipe.id}`)
      .expect(200);
    const body = response.body as RecipeDetailResponseDto;

    expect(body).toMatchObject({
      imageUrls: [
        'https://zest-images-test.s3.us-east-1.amazonaws.com/recipes/default.webp',
      ],
    });
  });
});
