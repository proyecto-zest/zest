import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

export function stableIngredientId(name: string): string {
  const bytes = createHash('sha1')
    .update(`zest:ingredient:${name}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    await seedIngredients(prisma);
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
