import { PrismaClient } from '@prisma/client';

function getTestDatabase(): { name: string; url: URL } {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for database tests');
  }

  const url = new URL(databaseUrl);
  const name = decodeURIComponent(url.pathname).slice(1);

  if (
    process.env.NODE_ENV !== 'test' ||
    !name.endsWith('_test') ||
    !/^[A-Za-z0-9_]+$/.test(name)
  ) {
    throw new Error(
      `Refusing to modify non-test database "${name}". ` +
        'DATABASE_URL must point to a database ending in "_test".',
    );
  }

  return { name, url };
}

export function assertIsolatedTestDatabase(): void {
  getTestDatabase();
}

export async function ensureTestDatabaseExists(): Promise<void> {
  const { name, url } = getTestDatabase();
  url.pathname = '/postgres';
  url.searchParams.set('schema', 'public');
  const adminPrisma = new PrismaClient({ datasourceUrl: url.toString() });

  try {
    const [database] = await adminPrisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(
        SELECT 1 FROM pg_database WHERE datname = ${name}
      ) AS "exists"
    `;

    if (!database.exists) {
      await adminPrisma.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await adminPrisma.$disconnect();
  }
}

export async function resetTestDatabase(prisma: PrismaClient): Promise<void> {
  assertIsolatedTestDatabase();
  await prisma.$executeRaw`
    TRUNCATE TABLE "recipes", "ingredients" RESTART IDENTITY CASCADE
  `;
}
