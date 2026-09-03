import { INestApplication, Logger } from '@nestjs/common';
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
import { DEFAULT_RECIPE_AUTHOR_ID } from '../src/recipes/recipes.constants';
import { StorageService } from '../src/storage/storage.service';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('POST /recipes (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication;
  let tomatoId: string;
  let oilId: string;
  const objectExists = jest.fn();
  const deleteObject = jest.fn();
  const getSignedReadUrl = jest.fn((key: string) =>
    Promise.resolve(`https://signed.test/${key}`),
  );

  const createCatalog = async (): Promise<void> => {
    const [tomato, oil] = await Promise.all([
      prisma.ingredient.create({ data: { name: 'Tomate' } }),
      prisma.ingredient.create({ data: { name: 'Aceite de oliva' } }),
    ]);
    tomatoId = tomato.id;
    oilId = oil.id;
  };

  const validRecipe = () => ({
    title: 'Ensalada de tomate',
    description: 'Una ensalada simple y fresca.',
    category: RecipeCategory.ENTRADA,
    time: 10,
    timeUnit: RecipeTimeUnit.MINUTOS,
    difficulty: RecipeDifficulty.FACIL,
    servings: 2,
    imageKey: 'recipes/uploaded.webp',
    ingredients: [
      { ingredientId: tomatoId, amount: '2', unit: IngredientUnit.UNIDAD },
      { ingredientId: oilId, amount: '1', unit: IngredientUnit.CUCHARADA },
    ],
    steps: ['Cortar el tomate.', 'Mezclar todos los ingredientes.'],
  });

  beforeAll(async () => {
    await prisma.$connect();
    await resetTestDatabase(prisma);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue({ objectExists, deleteObject, getSignedReadUrl })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    objectExists.mockResolvedValue(true);
    deleteObject.mockResolvedValue(undefined);
    await resetTestDatabase(prisma);
    await createCatalog();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('creates a recipe with ingredients, steps and an uploaded image key', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/recipes')
      .send(validRecipe())
      .expect(201);
    const responseBody = response.body as { id: string };

    expect(response.body).toMatchObject({
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      imageUrl: 'https://signed.test/recipes/uploaded.webp',
      title: 'Ensalada de tomate',
      ingredients: [
        {
          ingredientId: tomatoId,
          amount: '2',
          unit: IngredientUnit.UNIDAD,
          ingredient: { id: tomatoId, name: 'Tomate' },
        },
        {
          ingredientId: oilId,
          amount: '1',
          unit: IngredientUnit.CUCHARADA,
          ingredient: { id: oilId, name: 'Aceite de oliva' },
        },
      ],
      steps: [
        { stepNumber: 1, text: 'Cortar el tomate.' },
        { stepNumber: 2, text: 'Mezclar todos los ingredientes.' },
      ],
    });
    expect(response.body).not.toHaveProperty('s3Key');

    const persistedRecipe = await prisma.recipe.findUnique({
      where: { id: responseBody.id },
      include: { ingredients: true, steps: true, images: true },
    });

    expect(persistedRecipe).toMatchObject({
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      timeUnit: RecipeTimeUnit.MINUTOS,
      ingredients: [{ ingredientId: tomatoId }, { ingredientId: oilId }],
      steps: [{ stepNumber: 1 }, { stepNumber: 2 }],
      images: [{ s3Key: 'recipes/uploaded.webp' }],
    });
    expect(objectExists).toHaveBeenCalledWith('recipes/uploaded.webp');
  });

  it('returns 400 and creates nothing when an ingredient does not exist', async () => {
    const recipe = validRecipe();
    recipe.ingredients[1].ingredientId = randomUUID();

    await request(app.getHttpServer() as Server)
      .post('/recipes')
      .send(recipe)
      .expect(400);

    await expect(prisma.recipe.count()).resolves.toBe(0);
  });

  it('returns 400 when required fields are missing', async () => {
    await request(app.getHttpServer() as Server)
      .post('/recipes')
      .send({ title: 'Receta incompleta' })
      .expect(400);

    await expect(prisma.recipe.count()).resolves.toBe(0);
  });

  it('returns 400 and creates nothing when the image key is missing', async () => {
    await request(app.getHttpServer() as Server)
      .post('/recipes')
      .send({ ...validRecipe(), imageKey: undefined })
      .expect(400);

    await expect(prisma.recipe.count()).resolves.toBe(0);
  });

  it('returns 400 when the image key does not exist in S3', async () => {
    objectExists.mockResolvedValue(false);

    await request(app.getHttpServer() as Server)
      .post('/recipes')
      .send(validRecipe())
      .expect(400);

    await expect(prisma.recipe.count()).resolves.toBe(0);
  });

  it('returns 400 when the recipe has no steps', async () => {
    await request(app.getHttpServer() as Server)
      .post('/recipes')
      .send({ ...validRecipe(), steps: [] })
      .expect(400);

    await expect(prisma.recipe.count()).resolves.toBe(0);
  });

  it('returns 400 when the recipe has no ingredients', async () => {
    await request(app.getHttpServer() as Server)
      .post('/recipes')
      .send({ ...validRecipe(), ingredients: [] })
      .expect(400);

    await expect(prisma.recipe.count()).resolves.toBe(0);
  });

  it('returns 400 for invalid difficulty, time or ingredient units', async () => {
    const invalidRecipes = [
      { ...validRecipe(), difficulty: 'MUY_FACIL' },
      { ...validRecipe(), timeUnit: 'DIAS' },
      {
        ...validRecipe(),
        ingredients: [{ ingredientId: tomatoId, amount: '2', unit: 'PUÑADO' }],
      },
    ];

    for (const recipe of invalidRecipes) {
      await request(app.getHttpServer() as Server)
        .post('/recipes')
        .send(recipe)
        .expect(400);
    }

    await expect(prisma.recipe.count()).resolves.toBe(0);
  });

  it('replaces an image reference and deletes the previous S3 object', async () => {
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Receta existente',
        description: 'Descripción.',
        category: RecipeCategory.ALMUERZO,
        time: 20,
        timeUnit: RecipeTimeUnit.MINUTOS,
        difficulty: RecipeDifficulty.FACIL,
        servings: 2,
        images: { create: { s3Key: 'recipes/old.webp' } },
      },
    });

    const response = await request(app.getHttpServer() as Server)
      .put(`/recipes/${recipe.id}`)
      .send({ imageKey: 'recipes/new.webp' })
      .expect(200);

    expect(response.body).toMatchObject({
      id: recipe.id,
      imageUrls: ['https://signed.test/recipes/new.webp'],
    });
    await expect(
      prisma.recipeImage.findMany({ where: { recipeId: recipe.id } }),
    ).resolves.toMatchObject([{ s3Key: 'recipes/new.webp' }]);
    expect(deleteObject).toHaveBeenCalledWith('recipes/old.webp');
  });

  it('keeps the current image when an update has no new key', async () => {
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Receta existente',
        description: 'Descripción.',
        category: RecipeCategory.ALMUERZO,
        time: 20,
        timeUnit: RecipeTimeUnit.MINUTOS,
        difficulty: RecipeDifficulty.FACIL,
        servings: 2,
        images: { create: { s3Key: 'recipes/current.webp' } },
      },
    });

    await request(app.getHttpServer() as Server)
      .put(`/recipes/${recipe.id}`)
      .send({})
      .expect(200);

    await expect(
      prisma.recipeImage.findMany({ where: { recipeId: recipe.id } }),
    ).resolves.toMatchObject([{ s3Key: 'recipes/current.webp' }]);
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it('deletes the recipe, its relations and its S3 object', async () => {
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Receta para borrar',
        description: 'Descripción.',
        category: RecipeCategory.ALMUERZO,
        time: 20,
        timeUnit: RecipeTimeUnit.MINUTOS,
        difficulty: RecipeDifficulty.FACIL,
        servings: 2,
        ingredients: {
          create: {
            ingredientId: tomatoId,
            amount: '1',
            unit: IngredientUnit.UNIDAD,
          },
        },
        steps: { create: { stepNumber: 1, text: 'Preparar.' } },
        images: { create: { s3Key: 'recipes/delete.webp' } },
      },
    });

    await request(app.getHttpServer() as Server)
      .delete(`/recipes/${recipe.id}`)
      .expect(204);

    await expect(
      prisma.recipe.findUnique({ where: { id: recipe.id } }),
    ).resolves.toBeNull();
    await expect(
      prisma.recipeIngredient.count({ where: { recipeId: recipe.id } }),
    ).resolves.toBe(0);
    await expect(
      prisma.recipeStep.count({ where: { recipeId: recipe.id } }),
    ).resolves.toBe(0);
    await expect(
      prisma.recipeImage.count({ where: { recipeId: recipe.id } }),
    ).resolves.toBe(0);
    expect(deleteObject).toHaveBeenCalledWith('recipes/delete.webp');
  });

  it('deletes the recipe even when deleting its S3 object fails', async () => {
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    deleteObject.mockRejectedValueOnce(new Error('S3 unavailable'));
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Receta para borrar',
        description: 'Descripción.',
        category: RecipeCategory.ALMUERZO,
        time: 20,
        timeUnit: RecipeTimeUnit.MINUTOS,
        difficulty: RecipeDifficulty.FACIL,
        servings: 2,
        images: { create: { s3Key: 'recipes/delete-failure.webp' } },
      },
    });

    await request(app.getHttpServer() as Server)
      .delete(`/recipes/${recipe.id}`)
      .expect(204);

    await expect(
      prisma.recipe.findUnique({ where: { id: recipe.id } }),
    ).resolves.toBeNull();
    expect(loggerError).toHaveBeenCalled();
  });
});
