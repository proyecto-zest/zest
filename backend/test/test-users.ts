import { PrismaClient } from '@prisma/client';

import { DEFAULT_RECIPE_AUTHOR_ID } from '../src/recipes/recipes.constants';

export const defaultTestUser = {
  id: DEFAULT_RECIPE_AUTHOR_ID,
  auth0Sub: 'auth0|zest-default-author',
  name: 'Default Zest User',
  email: 'default-author@zest.local',
  emailVerified: false,
};

export async function createDefaultTestUser(
  prisma: PrismaClient,
): Promise<void> {
  await prisma.user.create({ data: defaultTestUser });
}
