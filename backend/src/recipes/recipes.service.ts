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
  },
} satisfies Prisma.RecipeInclude;

type CreatedRecipeRecord = Prisma.RecipeGetPayload<{
  include: typeof createdRecipeInclude;
}>;

type RecipeDetailRecord = Prisma.RecipeGetPayload<{
  include: typeof recipeDetailInclude;
}>;

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
      recipes: recipes.map(({ images, ...recipe }) => {
        const imageKeys = images.length
          ? images.map(({ s3Key }) => s3Key)
          : [DEFAULT_RECIPE_IMAGE_KEY];

        return {
          ...recipe,
          imageUrls: imageKeys.map((imageKey) => this.buildS3Url(imageKey)),
        };
      }),
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

    return this.toRecipeDetailResponse(recipe);
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
      return this.toCreatedRecipeResponse(recipe);
    });
  }

  private toCreatedRecipeResponse(
    recipe: CreatedRecipeRecord,
  ): CreatedRecipeResponseDto {
    return {
      id: recipe.id,
      authorId: recipe.authorId,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      time: recipe.time,
      timeUnit: recipe.timeUnit,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      ingredients: recipe.ingredients.map((recipeIngredient) => ({
        recipeId: recipeIngredient.recipeId,
        ingredientId: recipeIngredient.ingredientId,
        amount: recipeIngredient.amount,
        unit: recipeIngredient.unit,
        ingredient: {
          id: recipeIngredient.ingredient.id,
          name: recipeIngredient.ingredient.name,
        },
      })),
      steps: recipe.steps.map((step) => ({
        id: step.id,
        recipeId: step.recipeId,
        stepNumber: step.stepNumber,
        text: step.text,
      })),
      imageUrl: this.buildS3Url(
        recipe.images[0]?.s3Key ?? DEFAULT_RECIPE_IMAGE_KEY,
      ),
    };
  }

  private toRecipeDetailResponse(
    recipe: RecipeDetailRecord,
  ): RecipeDetailResponseDto {
    const imageKeys = recipe.images.length
      ? recipe.images.map(({ s3Key }) => s3Key)
      : [DEFAULT_RECIPE_IMAGE_KEY];

    return {
      id: recipe.id,
      authorId: recipe.authorId,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      time: recipe.time,
      timeUnit: recipe.timeUnit,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      ingredients: recipe.ingredients.map((recipeIngredient) => ({
        recipeId: recipeIngredient.recipeId,
        ingredientId: recipeIngredient.ingredientId,
        amount: recipeIngredient.amount,
        unit: recipeIngredient.unit,
        ingredient: {
          id: recipeIngredient.ingredient.id,
          name: recipeIngredient.ingredient.name,
        },
      })),
      steps: recipe.steps.map((step) => ({
        id: step.id,
        recipeId: step.recipeId,
        stepNumber: step.stepNumber,
        text: step.text,
      })),
      imageUrls: imageKeys.map((imageKey) => this.buildS3Url(imageKey)),
    };
  }

  private buildS3Url(s3Key: string): string {
    const bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');
    const region = this.configService.getOrThrow<string>('AWS_S3_REGION');

    return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
  }
}
