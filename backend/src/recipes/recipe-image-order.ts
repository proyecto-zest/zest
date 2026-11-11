import { Prisma } from '@prisma/client';

// Stable selection shared by recipe cards and the planner. IDs do not imply
// upload order or a designated cover (the model has neither field).
export const RECIPE_IMAGE_ORDER = {
  id: 'asc',
} satisfies Prisma.RecipeImageOrderByWithRelationInput;
