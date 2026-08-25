import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {
  DEFAULT_RECIPE_AUTHOR_ID,
  DEFAULT_RECIPE_IMAGE_URL,
} from './recipes.constants';

const createdRecipeInclude = {
  ingredients: {
    include: { ingredient: true },
  },
  steps: {
    orderBy: { stepNumber: 'asc' },
  },
  images: {
    select: { imageUrl: true },
  },
} satisfies Prisma.RecipeInclude;

type CreatedRecipeRecord = Prisma.RecipeGetPayload<{
  include: typeof createdRecipeInclude;
}>;

export type CreatedRecipe = Omit<CreatedRecipeRecord, 'images'> & {
  imageUrl: string;
};

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRecipeDto: CreateRecipeDto): Promise<CreatedRecipe> {
    return this.prisma.$transaction(async (transaction) => {
      const ingredientIds = createRecipeDto.ingredients.map(
        ({ ingredientId }) => ingredientId,
      );
      const existingIngredients = await transaction.ingredient.findMany({
        where: { id: { in: ingredientIds } },
        select: { id: true },
      });

      if (existingIngredients.length !== ingredientIds.length) {
        const existingIds = new Set(
          existingIngredients.map((ingredient) => ingredient.id),
        );
        const missingIds = ingredientIds.filter((id) => !existingIds.has(id));

        throw new BadRequestException(
          `Los siguientes ingredientes no existen: ${missingIds.join(', ')}`,
        );
      }

      const recipe = await transaction.recipe.create({
        data: {
          authorId: DEFAULT_RECIPE_AUTHOR_ID,
          title: createRecipeDto.title,
          description: createRecipeDto.description,
          category: createRecipeDto.category,
          time: createRecipeDto.time,
          difficulty: createRecipeDto.difficulty,
          servings: createRecipeDto.servings,
          ingredients: {
            create: createRecipeDto.ingredients.map(
              ({ ingredientId, amount }) => ({ ingredientId, amount }),
            ),
          },
          steps: {
            create: createRecipeDto.steps.map((text, index) => ({
              stepNumber: index + 1,
              text,
            })),
          },
          images: {
            create: { imageUrl: DEFAULT_RECIPE_IMAGE_URL },
          },
        },
        include: createdRecipeInclude,
      });
      const { images, ...createdRecipe } = recipe;

      return {
        ...createdRecipe,
        imageUrl: images[0].imageUrl,
      };
    });
  }
}
