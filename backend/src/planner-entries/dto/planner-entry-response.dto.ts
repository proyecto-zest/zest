import { RecipeTimeUnit } from '@prisma/client';

export class PlannerEntryResponseDto {
  id!: string;
  date!: string;
  quantity!: number;
  recipeId!: string;
  title!: string;
  imageUrl!: string | null;
  time!: number;
  timeUnit!: RecipeTimeUnit;
}
