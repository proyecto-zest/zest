import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const ingredientListSelect = {
  id: true,
  name: true,
} satisfies Prisma.IngredientSelect;

export type IngredientListItem = Prisma.IngredientGetPayload<{
  select: typeof ingredientListSelect;
}>;

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<IngredientListItem[]> {
    return this.prisma.ingredient.findMany({
      select: ingredientListSelect,
      orderBy: { name: 'asc' },
    });
  }
}
