import { PrismaClient, RecipeCategory } from '@prisma/client';

import { loadIngredientNames, seedIngredients } from '../prisma/seed';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('Recipe and Ingredient models (database)', () => {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.recipeIngredient.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.ingredient.deleteMany();
  });

  afterAll(async () => {
    await prisma.recipeIngredient.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.$disconnect();
  });

  it('creates and reads a recipe with its ingredients', async () => {
    const createdRecipe = await prisma.recipe.create({
      data: {
        title: 'Ensalada de tomate',
        description: 'Una ensalada simple y fresca.',
        category: RecipeCategory.ENTRADA,
        time: 10,
        difficulty: 'FACIL',
        servings: 2,
        ingredients: {
          create: [
            {
              amount: '2 unidades',
              ingredient: { create: { name: 'Tomate' } },
            },
            {
              amount: '1 cucharada',
              ingredient: { create: { name: 'Aceite de oliva' } },
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
        { amount: '1 cucharada', ingredient: { name: 'Aceite de oliva' } },
        { amount: '2 unidades', ingredient: { name: 'Tomate' } },
      ],
    });
  });

  it('rejects the same ingredient twice in one recipe', async () => {
    const ingredient = await prisma.ingredient.create({
      data: { name: 'Papa' },
    });
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Papas al horno',
        description: 'Papas doradas al horno.',
        category: RecipeCategory.ALMUERZO,
        time: 45,
        difficulty: 'FACIL',
        servings: 4,
      },
    });
    const relation = {
      recipeId: recipe.id,
      ingredientId: ingredient.id,
      amount: '1 kg',
    };

    await prisma.recipeIngredient.create({ data: relation });

    await expect(
      prisma.recipeIngredient.create({ data: relation }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rejects duplicate ingredient names', async () => {
    await prisma.ingredient.create({ data: { name: 'Cebolla' } });

    await expect(
      prisma.ingredient.create({ data: { name: 'Cebolla' } }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('seeds all default ingredients without duplicating them', async () => {
    const ingredientNames = loadIngredientNames();

    expect(ingredientNames).toHaveLength(213);
    expect(new Set(ingredientNames).size).toBe(213);

    await seedIngredients(prisma);
    await seedIngredients(prisma);

    await expect(prisma.ingredient.count()).resolves.toBe(213);
  });
});
