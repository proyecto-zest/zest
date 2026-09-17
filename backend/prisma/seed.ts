import {
  IngredientUnit,
  PrismaClient,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEMO_AUTHORS = ['santiago', 'tiago', 'ines'] as const;
const DEMO_RECIPE_COUNT = 30;

type DemoAuthor = (typeof DEMO_AUTHORS)[number];

type RecipeSeedIngredient = {
  name: string;
  amount: string;
  unit: IngredientUnit;
};

type RecipeSeedImage = {
  s3Key: string;
};

export type RecipeSeed = {
  slug: string;
  author: DemoAuthor;
  title: string;
  description: string;
  category: RecipeCategory;
  time: number;
  timeUnit: RecipeTimeUnit;
  difficulty: RecipeDifficulty;
  servings: number;
  ingredients: RecipeSeedIngredient[];
  steps: string[];
  images: RecipeSeedImage[];
};

function isIngredientGroups(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every(
      (group) =>
        Array.isArray(group) &&
        group.every(
          (ingredient) =>
            typeof ingredient === 'string' && ingredient.length > 0,
        ),
    )
  );
}

export function loadIngredientNames(): string[] {
  const filePath = join(__dirname, 'seed-data', 'ingredients.json');
  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));

  if (!isIngredientGroups(parsed)) {
    throw new Error('Invalid ingredients seed data');
  }

  const ingredientNames = Object.values(parsed).flat();

  if (
    new Set(ingredientNames).size !== ingredientNames.length ||
    ingredientNames.some(
      (ingredientName) =>
        ingredientName !== ingredientName.toLocaleLowerCase('en'),
    )
  ) {
    throw new Error(
      'Ingredient seed names must be unique and lowercase English',
    );
  }

  return ingredientNames;
}

function stableUuid(namespace: string, value: string): string {
  const bytes = createHash('sha1')
    .update(`zest:${namespace}:${value}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function stableIngredientId(name: string): string {
  return stableUuid('ingredient', name);
}

export function stableDemoAuthorId(author: DemoAuthor): string {
  return stableUuid('demo-author', author);
}

export function stableRecipeId(slug: string): string {
  return stableUuid('demo-recipe', slug);
}

export function stableRecipeStepId(slug: string, index: number): string {
  return stableUuid('demo-recipe-step', `${slug}:${index + 1}`);
}

export function stableRecipeImageId(slug: string, index: number): string {
  return stableUuid('demo-recipe-image', `${slug}:${index + 1}`);
}

export async function seedIngredients(prisma: PrismaClient): Promise<void> {
  const ingredientNames = loadIngredientNames();

  await prisma.$transaction(
    ingredientNames.map((name) =>
      prisma.ingredient.upsert({
        where: { id: stableIngredientId(name) },
        update: { name },
        create: { id: stableIngredientId(name), name },
      }),
    ),
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isEnumValue<T extends string>(
  enumType: Record<string, T>,
  value: unknown,
): value is T {
  return (
    typeof value === 'string' && Object.values(enumType).includes(value as T)
  );
}

function isRecipeSeedIngredient(value: unknown): value is RecipeSeedIngredient {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const ingredient = value as Record<string, unknown>;

  return (
    isNonEmptyString(ingredient.name) &&
    isNonEmptyString(ingredient.amount) &&
    isEnumValue(IngredientUnit, ingredient.unit)
  );
}

function isRecipeSeedImage(value: unknown): value is RecipeSeedImage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const image = value as Record<string, unknown>;

  return isNonEmptyString(image.s3Key) && image.s3Key.startsWith('recipes/');
}

function isRecipeSeed(value: unknown): value is RecipeSeed {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const recipe = value as Record<string, unknown>;

  return (
    isNonEmptyString(recipe.slug) &&
    DEMO_AUTHORS.includes(recipe.author as DemoAuthor) &&
    isNonEmptyString(recipe.title) &&
    isNonEmptyString(recipe.description) &&
    isEnumValue(RecipeCategory, recipe.category) &&
    isPositiveInteger(recipe.time) &&
    isEnumValue(RecipeTimeUnit, recipe.timeUnit) &&
    isEnumValue(RecipeDifficulty, recipe.difficulty) &&
    isPositiveInteger(recipe.servings) &&
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.length > 0 &&
    recipe.ingredients.every(isRecipeSeedIngredient) &&
    new Set(recipe.ingredients.map((ingredient) => ingredient.name)).size ===
      recipe.ingredients.length &&
    Array.isArray(recipe.steps) &&
    recipe.steps.length > 0 &&
    recipe.steps.every(isNonEmptyString) &&
    Array.isArray(recipe.images) &&
    recipe.images.length > 0 &&
    recipe.images.every(isRecipeSeedImage)
  );
}

export function loadDemoRecipes(): RecipeSeed[] {
  const filePath = join(__dirname, 'seed-data', 'recipes.json');
  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));

  if (
    !Array.isArray(parsed) ||
    parsed.length < DEMO_RECIPE_COUNT ||
    !parsed.every(isRecipeSeed)
  ) {
    throw new Error('Invalid demo recipe seed data');
  }

  const imageKeys = parsed.flatMap((recipe) =>
    recipe.images.map((image) => image.s3Key),
  );

  if (
    new Set(parsed.map((recipe) => recipe.slug)).size !== parsed.length ||
    !DEMO_AUTHORS.every((author) =>
      parsed.some((recipe) => recipe.author === author),
    ) ||
    new Set(imageKeys).size !== imageKeys.length ||
    !parsed.some((recipe) => recipe.images.length > 1)
  ) {
    throw new Error(
      'Demo recipes need unique slugs, authors, image keys, and a gallery',
    );
  }

  return parsed;
}

export async function seedRecipes(prisma: PrismaClient): Promise<void> {
  const recipes = loadDemoRecipes();
  const ingredientNames = [
    ...new Set(
      recipes.flatMap((recipe) =>
        recipe.ingredients.map((ingredient) => ingredient.name),
      ),
    ),
  ];
  const ingredients = await prisma.ingredient.findMany({
    where: { name: { in: ingredientNames } },
    select: { id: true, name: true },
  });
  const ingredientIds = new Map(
    ingredients.map((ingredient) => [ingredient.name, ingredient.id]),
  );
  const missingIngredients = ingredientNames.filter(
    (name) => !ingredientIds.has(name),
  );

  if (missingIngredients.length > 0) {
    throw new Error(
      `Demo recipes reference ingredients outside the catalog: ${missingIngredients.join(', ')}`,
    );
  }

  for (const recipe of recipes) {
    const recipeId = stableRecipeId(recipe.slug);

    await prisma.$transaction(async (transaction) => {
      await transaction.recipe.upsert({
        where: { id: recipeId },
        update: {
          authorId: stableDemoAuthorId(recipe.author),
          title: recipe.title,
          description: recipe.description,
          category: recipe.category,
          time: recipe.time,
          timeUnit: recipe.timeUnit,
          difficulty: recipe.difficulty,
          servings: recipe.servings,
        },
        create: {
          id: recipeId,
          authorId: stableDemoAuthorId(recipe.author),
          title: recipe.title,
          description: recipe.description,
          category: recipe.category,
          time: recipe.time,
          timeUnit: recipe.timeUnit,
          difficulty: recipe.difficulty,
          servings: recipe.servings,
        },
      });

      await transaction.recipeIngredient.deleteMany({ where: { recipeId } });
      await transaction.recipeStep.deleteMany({ where: { recipeId } });
      await transaction.recipeImage.deleteMany({ where: { recipeId } });

      await transaction.recipeIngredient.createMany({
        data: recipe.ingredients.map((ingredient) => ({
          recipeId,
          ingredientId: ingredientIds.get(ingredient.name)!,
          amount: ingredient.amount,
          unit: ingredient.unit,
        })),
      });
      await transaction.recipeStep.createMany({
        data: recipe.steps.map((text, index) => ({
          id: stableRecipeStepId(recipe.slug, index),
          recipeId,
          stepNumber: index + 1,
          text,
        })),
      });
      await transaction.recipeImage.createMany({
        data: recipe.images.map((image, index) => ({
          id: stableRecipeImageId(recipe.slug, index),
          recipeId,
          s3Key: image.s3Key,
        })),
      });
    });
  }
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    await seedIngredients(prisma);
    await seedRecipes(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
