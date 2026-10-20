import {
  Prisma,
  PrismaClient,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';

import { loadIngredientNames, seedIngredients } from '../prisma/seed';
import { DEFAULT_RECIPE_AUTHOR_ID } from '../src/recipes/recipes.constants';
import { resetTestDatabase } from './test-database';
import { createDefaultTestUser } from './test-users';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('PlannerEntry model (database)', () => {
  const prisma = new PrismaClient();
  const date = new Date('2026-11-03T00:00:00.000Z');
  const missingId = '11111111-1111-4111-8111-111111111111';
  let userId: string;
  let recipeId: string;

  const createRecipe = () =>
    prisma.recipe.create({
      data: {
        authorId: DEFAULT_RECIPE_AUTHOR_ID,
        title: 'Roasted tomato soup',
        description: 'Roasted tomatoes blended into a warm soup.',
        category: RecipeCategory.CENA,
        difficulty: RecipeDifficulty.FACIL,
        time: 40,
        timeUnit: RecipeTimeUnit.MINUTOS,
        servings: 2,
      },
    });

  beforeAll(() => prisma.$connect());
  beforeEach(async () => {
    await resetTestDatabase(prisma);
    await createDefaultTestUser(prisma);
    const user = await prisma.user.create({
      data: {
        auth0Sub: 'auth0|planner-model-user',
        name: 'Taylor Reed',
        email: 'planner-model@zest.test',
      },
    });
    userId = user.id;
    recipeId = (await createRecipe()).id;
  });
  afterAll(() => prisma.$disconnect());

  it('creates and reads a date-only entry for another author with quantity defaulting to 1', async () => {
    const data: Prisma.PlannerEntryUncheckedCreateInput = {
      userId,
      recipeId,
      date,
    };
    const created = await prisma.plannerEntry.create({ data });
    const entry = await prisma.plannerEntry.findUniqueOrThrow({
      where: { id: created.id },
      include: { user: true, recipe: true },
    });

    expect(entry).toMatchObject({
      id: created.id,
      userId,
      recipeId,
      quantity: 1,
      user: { name: 'Taylor Reed' },
      recipe: { title: 'Roasted tomato soup' },
    });
    expect(entry.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(entry.date.toISOString()).toBe('2026-11-03T00:00:00.000Z');
    expect(entry.recipe.authorId).not.toBe(userId);
  });

  it('persists an explicit quantity', async () => {
    const entry = await prisma.plannerEntry.create({
      data: { userId, recipeId, date, quantity: 3 },
    });

    await expect(
      prisma.plannerEntry.findUniqueOrThrow({ where: { id: entry.id } }),
    ).resolves.toMatchObject({ quantity: 3 });
  });

  it.each([1, 100])('accepts the quantity boundary %i', async (quantity) => {
    const entry = await prisma.plannerEntry.create({
      data: { userId, recipeId, date, quantity },
    });
    expect(entry.quantity).toBe(quantity);
  });

  it.each([0, -1, 101])(
    'rejects quantity %i directly in the database',
    async (quantity) => {
      await expect(
        prisma.plannerEntry.create({
          data: { userId, recipeId, date, quantity },
        }),
      ).rejects.toThrow(/planner_entries_quantity_check/);
      expect(await prisma.plannerEntry.count()).toBe(0);
    },
  );

  it.each([0, -1, 101])(
    'rejects an update to quantity %i and preserves the entry',
    async (quantity) => {
      const entry = await prisma.plannerEntry.create({
        data: { userId, recipeId, date, quantity: 3 },
      });
      await expect(
        prisma.plannerEntry.update({
          where: { id: entry.id },
          data: { quantity },
        }),
      ).rejects.toThrow(/planner_entries_quantity_check/);
      expect(
        await prisma.plannerEntry.findUniqueOrThrow({
          where: { id: entry.id },
        }),
      ).toMatchObject({ quantity: 3 });
    },
  );

  it('rejects an upsert increment exceeding 100 and preserves the previous quantity', async () => {
    const entry = await prisma.plannerEntry.create({
      data: { userId, recipeId, date, quantity: 100 },
    });
    await expect(
      prisma.plannerEntry.upsert({
        where: { userId_recipeId_date: { userId, recipeId, date } },
        create: { userId, recipeId, date, quantity: 1 },
        update: { quantity: { increment: 1 } },
      }),
    ).rejects.toThrow(/planner_entries_quantity_check/);
    expect(
      await prisma.plannerEntry.findUniqueOrThrow({
        where: { id: entry.id },
      }),
    ).toMatchObject({ quantity: 100 });
    expect(await prisma.plannerEntry.count()).toBe(1);
  });

  it('rejects the same recipe and date twice for one user', async () => {
    const data = { userId, recipeId, date };
    await prisma.plannerEntry.create({ data });

    await expect(prisma.plannerEntry.create({ data })).rejects.toMatchObject({
      code: 'P2002',
    });
    expect(await prisma.plannerEntry.count()).toBe(1);
  });

  it('allows different users, dates and recipes under the unique constraint', async () => {
    const otherRecipe = await createRecipe();
    await prisma.plannerEntry.createMany({
      data: [
        { userId, recipeId, date },
        { userId: DEFAULT_RECIPE_AUTHOR_ID, recipeId, date },
        { userId, recipeId, date: new Date('2026-11-04T00:00:00Z') },
        { userId, recipeId: otherRecipe.id, date },
      ],
    });

    expect(await prisma.plannerEntry.count()).toBe(4);
  });

  it('supports an atomic increment through the compound upsert key', async () => {
    const data = { userId, recipeId, date, quantity: 2 };
    const original = await prisma.plannerEntry.create({ data });
    const updated = await prisma.plannerEntry.upsert({
      where: { userId_recipeId_date: { userId, recipeId, date } },
      create: data,
      update: { quantity: { increment: 2 } },
    });

    expect(updated).toMatchObject({ id: original.id, quantity: 4 });
    expect(await prisma.plannerEntry.count()).toBe(1);
  });

  it('cascades recipe deletion without deleting the planner user or unrelated entries', async () => {
    const otherRecipe = await createRecipe();
    await prisma.plannerEntry.createMany({
      data: [
        { userId, recipeId, date },
        { userId: DEFAULT_RECIPE_AUTHOR_ID, recipeId, date },
        { userId, recipeId: otherRecipe.id, date },
      ],
    });

    await prisma.recipe.delete({ where: { id: recipeId } });

    expect(await prisma.plannerEntry.count({ where: { recipeId } })).toBe(0);
    expect(await prisma.plannerEntry.count()).toBe(1);
    expect(
      await prisma.user.findUnique({ where: { id: userId } }),
    ).not.toBeNull();
  });

  it.each(['userId', 'recipeId'] as const)(
    'rejects a missing %s through the foreign key',
    async (field) => {
      await expect(
        prisma.plannerEntry.create({
          data: { userId, recipeId, date, [field]: missingId },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    },
  );

  it('restricts user deletion while their planner entries exist', async () => {
    await prisma.plannerEntry.create({ data: { userId, recipeId, date } });

    await expect(
      prisma.user.delete({ where: { id: userId } }),
    ).rejects.toMatchObject({ code: 'P2003' });
    expect(await prisma.plannerEntry.count()).toBe(1);
  });

  it('queries a date range for only the requested user', async () => {
    await prisma.plannerEntry.createMany({
      data: [
        { userId, recipeId, date },
        { userId, recipeId, date: new Date('2026-11-05T00:00:00Z') },
        { userId, recipeId, date: new Date('2026-11-10T00:00:00Z') },
        { userId: DEFAULT_RECIPE_AUTHOR_ID, recipeId, date },
      ],
    });

    const entries = await prisma.plannerEntry.findMany({
      where: {
        userId,
        date: { gte: date, lte: new Date('2026-11-05T00:00:00Z') },
      },
      orderBy: { date: 'asc' },
    });

    expect(entries.map(({ date }) => date.toISOString().slice(0, 10))).toEqual([
      '2026-11-03',
      '2026-11-05',
    ]);
  });

  it('keeps the existing ingredient seed idempotent with planner entries present', async () => {
    const entry = await prisma.plannerEntry.create({
      data: { userId, recipeId, date },
    });

    await seedIngredients(prisma);
    await seedIngredients(prisma);

    expect(await prisma.ingredient.count()).toBe(loadIngredientNames().length);
    await expect(
      prisma.plannerEntry.findUniqueOrThrow({ where: { id: entry.id } }),
    ).resolves.toMatchObject({ quantity: 1 });
  });
});
