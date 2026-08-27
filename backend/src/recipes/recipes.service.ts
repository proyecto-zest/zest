import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IngredientUnit,
  Prisma,
  RecipeCategory,
  RecipeDifficulty,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {
  DEFAULT_RECIPE_AUTHOR_ID,
  DEFAULT_RECIPE_IMAGE_KEY,
} from './recipes.constants';

const createdRecipeInclude = {
  ingredients: {
    include: { ingredient: true },
  },
  steps: {
    orderBy: { stepNumber: 'asc' },
  },
  images: {
    select: { s3Key: true },
  },
} satisfies Prisma.RecipeInclude;

type CreatedRecipeRecord = Prisma.RecipeGetPayload<{
  include: typeof createdRecipeInclude;
}>;

export type CreatedRecipe = Omit<CreatedRecipeRecord, 'images'> & {
  imageUrl: string;
};

export type RecipeMetadata = {
  categories: string[];
  difficulties: string[];
  units: string[];
};

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  getMetadata(): RecipeMetadata {
    return {
      categories: Object.values(RecipeCategory),
      difficulties: Object.values(RecipeDifficulty),
      units: Object.values(IngredientUnit),
    };
  }

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
          timeUnit: createRecipeDto.timeUnit,
          difficulty: createRecipeDto.difficulty,
          servings: createRecipeDto.servings,
          ingredients: {
            create: createRecipeDto.ingredients.map(
              ({ ingredientId, amount, unit }) => ({
                ingredientId,
                amount,
                unit,
              }),
            ),
          },
          steps: {
            create: createRecipeDto.steps.map((text, index) => ({
              stepNumber: index + 1,
              text,
            })),
          },
          images: {
            create: { s3Key: DEFAULT_RECIPE_IMAGE_KEY },
          },
        },
        include: createdRecipeInclude,
      });
      const { images, ...createdRecipe } = recipe;

      return {
        ...createdRecipe,
        imageUrl: this.buildS3Url(images[0].s3Key),
      };
    });
  }

  private buildS3Url(s3Key: string): string {
    const bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');
    const region = this.configService.getOrThrow<string>('AWS_S3_REGION');

    return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
  }
}
