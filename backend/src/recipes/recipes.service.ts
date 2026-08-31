import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IngredientUnit,
  Prisma,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import {
  CreatedRecipeResponseDto,
  PaginatedRecipesResponseDto,
  RecipeDetailResponseDto,
  RecipeMetadataResponseDto,
} from './dto/recipe-response.dto';
import {
  DEFAULT_RECIPE_AUTHOR_ID,
  DEFAULT_RECIPE_IMAGE_KEY,
  MAX_RECIPES_LIMIT,
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

const recipeCardSelect = {
  id: true,
  title: true,
  category: true,
  difficulty: true,
  time: true,
  servings: true,
  images: {
    select: { s3Key: true },
    take: 1,
  },
} satisfies Prisma.RecipeSelect;

const recipeDetailInclude = {
  ingredients: {
    include: { ingredient: true },
  },
  steps: {
    orderBy: { stepNumber: 'asc' },
  },
  images: {
    select: { s3Key: true },
    take: 1,
  },
} satisfies Prisma.RecipeInclude;

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  getMetadata(): RecipeMetadataResponseDto {
    return {
      categories: Object.values(RecipeCategory),
      difficulties: Object.values(RecipeDifficulty),
      units: Object.values(IngredientUnit),
      timeUnits: Object.values(RecipeTimeUnit),
    };
  }

  async findAll(
    query: ListRecipesQueryDto,
  ): Promise<PaginatedRecipesResponseDto> {
    const page = query.page;
    const limit = Math.min(query.limit, MAX_RECIPES_LIMIT);
    const where: Prisma.RecipeWhereInput = {};
    const [total, recipes] = await Promise.all([
      this.prisma.recipe.count({ where }),
      this.prisma.recipe.findMany({
        where,
        select: recipeCardSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      recipes: recipes.map(({ images, ...recipe }) => ({
        ...recipe,
        imageUrl: this.buildS3Url(images[0]?.s3Key ?? DEFAULT_RECIPE_IMAGE_KEY),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<RecipeDetailResponseDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: recipeDetailInclude,
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const { images, ...recipeDetail } = recipe;

    return {
      ...recipeDetail,
      imageUrl: this.buildS3Url(images[0]?.s3Key ?? DEFAULT_RECIPE_IMAGE_KEY),
    };
  }

  async create(
    createRecipeDto: CreateRecipeDto,
  ): Promise<CreatedRecipeResponseDto> {
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
