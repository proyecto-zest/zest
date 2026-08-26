import { INestApplication, ValidationPipe } from '@nestjs/common';
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
import {
  DEFAULT_RECIPE_AUTHOR_ID,
  DEFAULT_RECIPE_IMAGE_KEY,
} from '../src/recipes/recipes.constants';

const DEFAULT_RECIPE_IMAGE_URL =
  'https://zest-images-test.s3.us-east-1.amazonaws.com/recipes/default.webp';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('POST /recipes (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication;
  let tomatoId: string;
  let oilId: string;

  const cleanRecipes = async (): Promise<void> => {
    await prisma.recipeImage.deleteMany();
    await prisma.recipeStep.deleteMany();
    await prisma.recipeIngredient.deleteMany();
    await prisma.recipe.deleteMany();
  };

  const validRecipe = () => ({
    title: 'Ensalada de tomate',
    description: 'Una ensalada simple y fresca.',
    category: RecipeCategory.ENTRADA,
    time: 10,
    timeUnit: RecipeTimeUnit.MINUTOS,
    difficulty: RecipeDifficulty.FACIL,
    servings: 2,
    ingredients: [
      { ingredientId: tomatoId, amount: '2', unit: IngredientUnit.UNIDAD },
      { ingredientId: oilId, amount: '1', unit: IngredientUnit.CUCHARADA },
    ],
    steps: ['Cortar el tomate.', 'Mezclar todos los ingredientes.'],
  });

  beforeAll(async () => {
    await prisma.$connect();
    const [tomato, oil] = await Promise.all([
      prisma.ingredient.upsert({
        where: { name: 'Tomate' },
        update: {},
        create: { name: 'Tomate' },
      }),
      prisma.ingredient.upsert({
        where: { name: 'Aceite de oliva' },
        update: {},
        create: { name: 'Aceite de oliva' },
      }),
    ]);
    tomatoId = tomato.id;
    oilId = oil.id;

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

  it('creates a recipe with ingredients, steps and fixed defaults', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/recipes')
      .send(validRecipe())
      .expect(201);
    const responseBody = response.body as { id: string };

    expect(response.body).toMatchObject({
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      imageUrl: DEFAULT_RECIPE_IMAGE_URL,
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
      images: [{ s3Key: DEFAULT_RECIPE_IMAGE_KEY }],
    });
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
});
