import { PrismaClient } from '@prisma/client';
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

  return Object.values(parsed).flat();
}

export async function seedIngredients(prisma: PrismaClient): Promise<void> {
  const ingredientNames = loadIngredientNames();

  await prisma.$transaction(
    ingredientNames.map((name) =>
      prisma.ingredient.upsert({
        where: { name },
        update: {},
        create: { name },
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
