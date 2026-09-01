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
import { RecipeDetailResponseDto } from '../src/recipes/dto/recipe-response.dto';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('GET /recipes/:id (e2e)', () => {
  const prisma = new PrismaClient();
  const ingredientName = 'Ingrediente detalle ZEST-15';
  const recipeWithImagesId = '15151515-1515-4515-8515-151515151501';
  const recipeWithoutImagesId = '15151515-1515-4515-8515-151515151502';
  const testRecipeIds = [recipeWithImagesId, recipeWithoutImagesId];
  let app: INestApplication;

  const cleanTestData = async (): Promise<void> => {
    await prisma.recipeImage.deleteMany({
      where: { recipeId: { in: testRecipeIds } },
    });
    await prisma.recipeStep.deleteMany({
      where: { recipeId: { in: testRecipeIds } },
    });
    await prisma.recipeIngredient.deleteMany({
      where: { recipeId: { in: testRecipeIds } },
    });
    await prisma.recipe.deleteMany({
      where: { id: { in: testRecipeIds } },
    });
    await prisma.ingredient.deleteMany({ where: { name: ingredientName } });
  };

  beforeAll(async () => {
    await prisma.$connect();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(cleanTestData);

  afterAll(async () => {
    await cleanTestData();
    await app.close();
    await prisma.$disconnect();
  });

  it('returns the complete data for an existing recipe', async () => {
    const recipe = await prisma.recipe.create({
      data: {
        id: recipeWithImagesId,
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
        id: recipeWithoutImagesId,
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
