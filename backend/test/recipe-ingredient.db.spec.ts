import {
  IngredientUnit,
  PrismaClient,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';

import {
  loadIngredientNames,
  seedIngredients,
  stableIngredientId,
} from '../prisma/seed';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('Recipe and Ingredient models (database)', () => {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.$connect();
    await resetTestDatabase(prisma);
  });

  beforeEach(() => resetTestDatabase(prisma));

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates and reads a recipe with its ingredients', async () => {
    const createdRecipe = await prisma.recipe.create({
      data: {
        title: 'Ensalada de tomate',
        description: 'Una ensalada simple y fresca.',
        category: RecipeCategory.ENTRADA,
        time: 10,
        timeUnit: RecipeTimeUnit.MINUTOS,
        difficulty: RecipeDifficulty.FACIL,
        servings: 2,
        ingredients: {
          create: [
            {
              amount: '2',
              unit: IngredientUnit.UNIDAD,
              ingredient: { create: { name: 'tomato' } },
            },
            {
              amount: '1',
              unit: IngredientUnit.CUCHARADA,
              ingredient: { create: { name: 'olive oil' } },
            },
          ],
        },
      },
    });

    const recipe = await prisma.recipe.findUnique({
      where: { id: createdRecipe.id },
      include: {
        ingredients: {
          include: { ingredient: true },
          orderBy: { ingredient: { name: 'asc' } },
        },
      },
    });

    expect(recipe).toMatchObject({
      authorId: null,
      title: 'Ensalada de tomate',
      ingredients: [
        {
          amount: '1',
          unit: IngredientUnit.CUCHARADA,
          ingredient: { name: 'olive oil' },
        },
        {
          amount: '2',
          unit: IngredientUnit.UNIDAD,
          ingredient: { name: 'tomato' },
        },
      ],
    });
  });

  it('rejects the same ingredient twice in one recipe', async () => {
    const ingredient = await prisma.ingredient.create({
      data: { name: 'potato' },
    });
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Papas al horno',
        description: 'Papas doradas al horno.',
        category: RecipeCategory.ALMUERZO,
        time: 45,
        timeUnit: RecipeTimeUnit.MINUTOS,
        difficulty: RecipeDifficulty.FACIL,
        servings: 4,
      },
    });
    const relation = {
      recipeId: recipe.id,
      ingredientId: ingredient.id,
      amount: '1',
      unit: IngredientUnit.KILOGRAMO,
    };

    await prisma.recipeIngredient.create({ data: relation });

    await expect(
      prisma.recipeIngredient.create({ data: relation }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rejects duplicate ingredient names', async () => {
    await prisma.ingredient.create({ data: { name: 'onion' } });

    await expect(
      prisma.ingredient.create({ data: { name: 'onion' } }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('seeds all default ingredients without duplicating them', async () => {
    const ingredientNames = loadIngredientNames();

    expect(ingredientNames).toHaveLength(360);
    expect(new Set(ingredientNames).size).toBe(360);
    expect(
      ingredientNames.every(
        (ingredientName) =>
          ingredientName === ingredientName.toLocaleLowerCase('en'),
      ),
    ).toBe(true);

    await seedIngredients(prisma);
    await seedIngredients(prisma);

    const seededIngredients = await prisma.ingredient.findMany({
      select: { id: true, name: true },
    });

    expect(seededIngredients).toHaveLength(360);
    expect(new Set(seededIngredients.map(({ id }) => id))).toEqual(
      new Set(ingredientNames.map(stableIngredientId)),
    );
  });
});
