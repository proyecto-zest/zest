import { PrismaClient } from '@prisma/client';

import {
  loadDemoRecipes,
  recipeImageKey,
  seedIngredients,
  seedRecipes,
  stableDemoAuthorId,
  stableRecipeId,
} from '../prisma/seed';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('Demo recipe seed (database)', () => {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.$connect();
    await resetTestDatabase(prisma);
  });

  beforeEach(() => resetTestDatabase(prisma));

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('seeds realistic recipes idempotently without adding ingredients', async () => {
    const recipes = loadDemoRecipes();

    expect(recipes).toHaveLength(30);
    expect(new Set(recipes.map(({ author }) => author))).toEqual(
      new Set(['santiago', 'tiago', 'ines']),
    );
    expect(recipes.some(({ images }) => images.length > 1)).toBe(true);

    await seedIngredients(prisma);
    await seedRecipes(prisma);
    await seedRecipes(prisma);

    const recipeIds = recipes.map(({ slug }) => stableRecipeId(slug));
    const seededRecipes = await prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      include: {
        ingredients: true,
        steps: { orderBy: { stepNumber: 'asc' } },
        images: true,
      },
    });

    expect(seededRecipes).toHaveLength(30);
    expect(await prisma.ingredient.count()).toBe(360);
    expect(new Set(seededRecipes.map(({ authorId }) => authorId))).toEqual(
      new Set([
        stableDemoAuthorId('santiago'),
        stableDemoAuthorId('tiago'),
        stableDemoAuthorId('ines'),
      ]),
    );

    for (const recipe of seededRecipes) {
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.images.length).toBeGreaterThan(0);
      expect(recipe.steps.map(({ stepNumber }) => stepNumber)).toEqual(
        recipe.steps.map((_step, index) => index + 1),
      );
    }

    const expectedKeys = recipes.flatMap((recipe) =>
      recipe.images.map((_image, index) => recipeImageKey(recipe.slug, index)),
    );
    const persistedKeys = seededRecipes.flatMap(({ images }) =>
      images.map(({ s3Key }) => s3Key),
    );

    expect(new Set(persistedKeys)).toEqual(new Set(expectedKeys));
    expect(
      persistedKeys.every((key) =>
        /^recipes\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(key),
      ),
    ).toBe(true);
  });
});
